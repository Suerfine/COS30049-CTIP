"""
ParkGuard AI - Inference Server
================================
Communicates with the Streamlit frontend over a single persistent WebSocket.
The client sends JPEG frames as binary; the server responds with JSON results.

Architecture:
  - One WebSocket endpoint: /ws/detect
  - Frames are decoded, run through YOLO object detection, then conditionally
    through pose estimation if a human is detected.
  - Results are sent back immediately as JSON — no polling, no HTTP overhead.
  - A dedicated asyncio worker queue decouples frame receipt from inference,
    so the network loop is never blocked by the GPU.

Run with:
  uvicorn server:app --host 0.0.0.0 --port 8000 --reload
"""

import asyncio
import json
import logging
import time
from contextlib import asynccontextmanager

import cv2
import httpx
import numpy as np
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO
from compliance import ComplianceEvaluator
evaluator = ComplianceEvaluator()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("parkguard")

# ---------------------------------------------------------------------------
# Model loading — done once at startup via lifespan
# ---------------------------------------------------------------------------
models: dict = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Loading YOLO models…")
    models["detector"] = YOLO("runs/detect/object-detection8/weights/best.pt")
    models["pose"]     = YOLO("yolo26n-pose.pt")
    logger.info("Models ready.")
    yield
    models.clear()

app = FastAPI(title="ParkGuard AI Server", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
HUMAN_CLASS_ID     = 2     # class index for 'person' in your stitched model
DETECTION_CONF     = 0.5
POSE_CONF          = 0.5
INFERENCE_QUEUE_SZ = 2     # max frames buffered for inference (drop excess)
EXPRESS_API_URL    = "http://localhost:5000/api"  # Backend API endpoint


# ---------------------------------------------------------------------------
# Parsing helpers
# ---------------------------------------------------------------------------
def parse_detections(results) -> list[dict]:
    out = []
    for r in results:
        for box in r.boxes:
            x1, y1, x2, y2 = box.xyxy[0].tolist()
            conf   = box.conf[0].item()
            cls_id = int(box.cls[0].item())
            out.append({
                "bbox":       [round(v, 2) for v in (x1, y1, x2, y2)],
                "confidence": round(conf, 4),
                "class":      cls_id,
                "class_name": r.names[cls_id],
            })
    return out


def parse_poses(results) -> list[list[dict]]:
    poses = []
    for r in results:
        if r.keypoints is None:
            continue
        for kp in r.keypoints:
            xy   = kp.xy[0].tolist()
            conf = (kp.conf[0].tolist()
                    if (hasattr(kp, "conf") and kp.conf is not None)
                    else [1.0] * len(xy))
            kp_list = []
            for (x, y), c in zip(xy, conf):
                kp_list.append({
                    "x":          round(x, 2),
                    "y":          round(y, 2),
                    "confidence": round(c, 4),
                })
            poses.append(kp_list)
    return poses


# ---------------------------------------------------------------------------
# Event logging to Express API
# ---------------------------------------------------------------------------
async def log_compliance_event_to_backend(
    user_id: int,
    event_type: str,
    severity: str,
    description: str,
    metadata: dict = None,
    latitude: float = None,
    longitude: float = None,
):
    """
    Logs a compliance event to the Express backend API.
    Runs asynchronously to avoid blocking inference.
    """
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            payload = {
                "user_id": user_id,
                "event_type": event_type,
                "severity": severity,
                "description": description,
                "metadata": metadata or {},
                "latitude": latitude,
                "longitude": longitude,
            }
            response = await client.post(
                f"{EXPRESS_API_URL}/compliance-events",
                json=payload,
            )
            if response.status_code != 201:
                logger.warning(
                    f"Failed to log compliance event: {response.status_code} {response.text}"
                )
    except Exception as e:
        logger.error(f"Error logging compliance event: {e}")


# ---------------------------------------------------------------------------
# Synchronous inference (runs in a thread via loop.run_in_executor)
# ---------------------------------------------------------------------------
def run_inference(img: np.ndarray) -> dict:
    t0 = time.perf_counter()
    h, w = img.shape[:2]

    # 1. Run Detections (Plants, Orangutans, Humans)
    det_results  = models["detector"].predict(img, conf=DETECTION_CONF, verbose=False)
    detections   = parse_detections(det_results)
    human_detected = any(d["class"] == HUMAN_CLASS_ID for d in detections)

    poses = []
    if human_detected:
        pose_results = models["pose"].predict(img, conf=POSE_CONF, verbose=False)
        poses        = parse_poses(pose_results)

    # 2. Run Compliance Evaluation
    compliance_data = evaluator.evaluate_frame(poses, detections, w, h)

    elapsed_ms = round((time.perf_counter() - t0) * 1000, 1)

    # 3. Bundle and return
    return {
        "human_detected": human_detected,
        "detections":     detections,
        "poses":          poses,
        "compliance":     compliance_data, # <-- New payload for the frontend
        "inference_ms":   elapsed_ms,
    }


# ---------------------------------------------------------------------------
# WebSocket endpoint
# ---------------------------------------------------------------------------
@app.websocket("/ws/detect")
async def ws_detect(websocket: WebSocket):
    await websocket.accept()
    
    # Extract user_id from query parameters (default to 1 for demo)
    query_params = websocket.query_params
    user_id = int(query_params.get("user_id", 1))
    
    logger.info(f"Client connected: {websocket.client} (user_id={user_id})")

    loop  = asyncio.get_event_loop()
    queue: asyncio.Queue[bytes] = asyncio.Queue(maxsize=INFERENCE_QUEUE_SZ)
    
    # Track previous compliance state to detect new events
    prev_plucking_count = 0
    prev_strike_count = 0
    prev_animal_touch = False

    # --- Worker task: pull frames from queue, run inference, send result ---
    async def inference_worker():
        nonlocal prev_plucking_count, prev_strike_count, prev_animal_touch
        
        while True:
            frame_bytes = await queue.get()
            if frame_bytes is None:          # sentinel → shutdown
                break

            # Decode JPEG → numpy
            arr = np.frombuffer(frame_bytes, dtype=np.uint8)
            img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
            if img is None:
                await websocket.send_text(json.dumps({"error": "bad frame"}))
                continue

            # Run inference off the event loop so it doesn't block I/O
            try:
                result = await loop.run_in_executor(None, run_inference, img)
                
                # Check for compliance events and log them
                compliance = result.get("compliance", {})
                
                # Log plucking event if count increased
                if compliance.get("pluck_event_count", 0) > prev_plucking_count:
                    asyncio.create_task(
                        log_compliance_event_to_backend(
                            user_id=user_id,
                            event_type="plucking_plants",
                            severity="medium",
                            description="Plant plucking detected - user attempted to pluck vegetation",
                            metadata={
                                "pluck_count": compliance.get("pluck_event_count", 0),
                                "hand_plant_overlaps": compliance.get("hand_plant_overlaps", 0),
                            },
                        )
                    )
                    prev_plucking_count = compliance.get("pluck_event_count", 0)
                
                # Log animal strike event if count increased
                if compliance.get("strike_event_count", 0) > prev_strike_count:
                    asyncio.create_task(
                        log_compliance_event_to_backend(
                            user_id=user_id,
                            event_type="hitting_animal",
                            severity="medium",
                            description="Animal strike detected - user attempted to strike an animal",
                            metadata={
                                "strike_count": compliance.get("strike_event_count", 0),
                            },
                        )
                    )
                    prev_strike_count = compliance.get("strike_event_count", 0)
                
                # Log extended animal touch
                if (compliance.get("animal_extended_touch", False) and 
                    not prev_animal_touch):
                    asyncio.create_task(
                        log_compliance_event_to_backend(
                            user_id=user_id,
                            event_type="extended_animal_touch",
                            severity="medium",
                            description="Extended animal touch detected - user in prolonged contact with animal",
                        )
                    )
                    prev_animal_touch = compliance.get("animal_extended_touch", False)
                elif not compliance.get("animal_extended_touch", False):
                    prev_animal_touch = False
                
                await websocket.send_text(json.dumps(result))
            except Exception as exc:
                logger.exception("Inference error: %s", exc)
                await websocket.send_text(json.dumps({"error": str(exc)}))

    worker_task = asyncio.create_task(inference_worker())

    # --- Receiver: read frames from the websocket and enqueue them ---
    try:
        while True:
            data = await websocket.receive_bytes()

            # If the queue is full, drop the oldest frame to stay real-time
            if queue.full():
                try:
                    queue.get_nowait()
                except asyncio.QueueEmpty:
                    pass

            await queue.put(data)

    except WebSocketDisconnect:
        logger.info("Client disconnected.")
    except Exception as exc:
        logger.exception("WebSocket error: %s", exc)
    finally:
        await queue.put(None)   # stop the worker
        await worker_task
        logger.info("Worker stopped.")


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------
@app.get("/health")
async def health():
    return {"status": "ok", "models_loaded": list(models.keys())}