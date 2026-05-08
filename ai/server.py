import asyncio
import json
import logging
import os
import time
from contextlib import asynccontextmanager

import cv2
import httpx
import numpy as np
from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO
from scripts.compliance import ComplianceEvaluator
from zeroconf import ServiceInfo, Zeroconf
import socket

evaluator = ComplianceEvaluator()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("parkguard")

models: dict = {}

async def download_model(url: str, save_path: str):
    logger.info(f"Downloading model to {save_path}...")
    if "drive.google.com" in url:
        if "/file/d/" in url:
            file_id = url.split("/file/d/")[1].split("/")[0]
            url = f"https://drive.google.com/uc?id={file_id}&export=download"
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, follow_redirects=True, timeout=300.0)
            response.raise_for_status()
            with open(save_path, "wb") as f:
                f.write(response.content)
            return True
    except Exception as e:
        logger.error(f"❌ Failed to download model: {e}")
        return False

async def check_and_download_models():
    models_to_check = [
        {
            "name": "object_detection_model.pt",
            "url": "https://drive.google.com/file/d/1f1mXVV37U7nor5tY9asqtgHrEssak3Ot/view?usp=drive_link",
            "description": "Object Detection Model (YOLO)"
        },
        {
            "name": "yolo26n-pose.pt",
            "url": "https://drive.google.com/file/d/1F5AyMn4guPdvpRXYbFBJN7ls9dcUfYCo/view?usp=sharing",
            "description": "Pose Estimation Model (YOLO Nano)"
        },
    ]
    for model_info in models_to_check:
        model_name, url, description = model_info["name"], model_info["url"], model_info["description"]
        if os.path.exists(model_name):
            logger.info(f"✅ {description} found locally")
        else:
            logger.warning(f"⚠️  Downloading {description}...")
            if not await download_model(url, model_name):
                raise RuntimeError(f"Could not load or download {model_name}.")

@asynccontextmanager
async def lifespan(app: FastAPI):
    await check_and_download_models()
    models["detector"] = YOLO("object_detection_model.pt")
    models["pose"]     = YOLO("yolo26n-pose.pt")
    
    info = ServiceInfo("_parkguard._tcp.local.", "ParkGuard Server._parkguard._tcp.local.", addresses=[socket.inet_aton("0.0.0.0")], port=8000)
    zeroconf = Zeroconf()
    try:
        zeroconf.register_service(info)
    except Exception as e:
        pass
    
    yield
    zeroconf.unregister_service(info)
    zeroconf.close()
    models.clear()

app = FastAPI(title="ParkGuard AI Server", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

HUMAN_CLASS_ID = 2
DETECTION_CONF = 0.5
POSE_CONF = 0.5

def parse_detections(results) -> list[dict]:
    out = []
    for r in results:
        for box in r.boxes:
            x1, y1, x2, y2 = box.xyxy[0].tolist()
            conf, cls_id = box.conf[0].item(), int(box.cls[0].item())
            out.append({
                "bbox": [round(v, 2) for v in (x1, y1, x2, y2)],
                "confidence": round(conf, 4),
                "class": cls_id,
                "class_name": r.names[cls_id],
            })
    return out

def parse_poses(results) -> list[list[dict]]:
    poses = []
    for r in results:
        if r.keypoints is None: continue
        for kp in r.keypoints:
            xy = kp.xy[0].tolist()
            conf = kp.conf[0].tolist() if (hasattr(kp, "conf") and kp.conf is not None) else [1.0] * len(xy)
            kp_list = [{"x": round(x, 2), "y": round(y, 2), "confidence": round(c, 4)} for (x, y), c in zip(xy, conf)]
            poses.append(kp_list)
    return poses

def run_inference(img: np.ndarray) -> dict:
    t0 = time.perf_counter()
    h, w = img.shape[:2]

    det_results = models["detector"].predict(img, conf=DETECTION_CONF, verbose=False)
    detections = parse_detections(det_results)
    human_detected = any(d["class"] == HUMAN_CLASS_ID for d in detections)

    poses = []
    if human_detected:
        pose_results = models["pose"].predict(img, conf=POSE_CONF, verbose=False)
        poses = parse_poses(pose_results)

    compliance_data = evaluator.evaluate_frame(poses, detections, w, h)
    elapsed_ms = round((time.perf_counter() - t0) * 1000, 1)

    return {
        "human_detected": human_detected,
        "detections": detections,
        "poses": poses,
        "compliance": compliance_data,
        "inference_ms": elapsed_ms,
    }


# ---------------------------------------------------------------------------
# NEW: Standard HTTP POST Endpoint (Replacing WebSocket)
# ---------------------------------------------------------------------------
from pydantic import BaseModel
import base64

class FrameRequest(BaseModel):
    image_base64: str
    user_id: int = 1

@app.post("/detect")
async def detect_frame(payload: FrameRequest):
    """Receives JSON containing a base64 image, runs inference, and returns JSON."""
    try:
        # Decode the base64 string back into bytes
        frame_bytes = base64.b64decode(payload.image_base64)
        arr = np.frombuffer(frame_bytes, dtype=np.uint8)
        img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
        
        if img is None:
            return {"error": "Failed to decode image from base64 data"}

        # Run inference in a threadpool so it doesn't block FastAPI
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(None, run_inference, img)
        
        return result
    except Exception as exc:
        logger.exception("Inference error: %s", exc)
        return {"error": str(exc)}

@app.get("/health")
async def health():
    return {"status": "ok", "models_loaded": list(models.keys())}