import base64
import json
import os
import tempfile

import cv2
import numpy as np
import streamlit as st
from PIL import Image
import websocket  # websocket-client

DEFAULT_SERVER_URL = "ws://localhost:8000/ws/detect"

# COCO-17 skeleton connections for drawing pose
POSE_CONNECTIONS = [
    (0, 1), (0, 2), (1, 3), (2, 4),
    (5, 7), (7, 9), (6, 8), (8, 10),
    (5, 6), (5, 11), (6, 12), (11, 12),
    (11, 13), (13, 15), (12, 14), (14, 16),
]
KP_CONF_THRESH = 0.3

st.set_page_config(page_title="ParkGuard Compliance Tester", layout="wide")
st.title("ParkGuard — Compliance Detection Tester")


# ── WebSocket helpers ─────────────────────────────────────────────────────────

def open_ws(url: str) -> websocket.WebSocket:
    ws = websocket.WebSocket()
    ws.connect(url)
    return ws


def send_frame(ws: websocket.WebSocket, bgr_frame: np.ndarray) -> dict:
    _, buf = cv2.imencode(".jpg", bgr_frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
    b64 = base64.b64encode(buf.tobytes()).decode()
    ws.send(json.dumps({"image_base64": b64}))
    return json.loads(ws.recv())


# ── Visualization ─────────────────────────────────────────────────────────────

def draw_results(bgr: np.ndarray, detections: list, poses: list, human_boxes: list = None) -> np.ndarray:
    out = bgr.copy()
    class_colors = {0: (0, 200, 0), 1: (0, 140, 255)}  # plant=green, animal=orange

    for det in detections:
        x1, y1, x2, y2 = [int(v) for v in det["bbox"]]
        color = class_colors.get(det["class"], (200, 200, 200))
        cv2.rectangle(out, (x1, y1), (x2, y2), color, 2)
        label = f"{det['class_name']} {det['confidence']:.2f}"
        cv2.putText(out, label, (x1, max(y1 - 6, 14)), cv2.FONT_HERSHEY_SIMPLEX, 0.55, color, 2)

    for hb in (human_boxes or []):
        x1, y1, x2, y2 = [int(v) for v in hb["bbox"]]
        cv2.rectangle(out, (x1, y1), (x2, y2), (255, 100, 0), 2)  # blue
        label = f"human {hb['confidence']:.2f}"
        cv2.putText(out, label, (x1, max(y1 - 6, 14)), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 100, 0), 2)

    for kp_list in poses:
        for a, b in POSE_CONNECTIONS:
            if a < len(kp_list) and b < len(kp_list):
                kpa, kpb = kp_list[a], kp_list[b]
                if kpa["confidence"] >= KP_CONF_THRESH and kpb["confidence"] >= KP_CONF_THRESH:
                    cv2.line(out,
                             (int(kpa["x"]), int(kpa["y"])),
                             (int(kpb["x"]), int(kpb["y"])),
                             (0, 255, 255), 2)
        for kp in kp_list:
            if kp["confidence"] >= KP_CONF_THRESH:
                cv2.circle(out, (int(kp["x"]), int(kp["y"])), 4, (0, 0, 255), -1)

    return out


# ── Compliance display ────────────────────────────────────────────────────────

def show_compliance(compliance: dict):
    st.subheader("Compliance Status")
    flags = {
        "Touching Plant":        compliance.get("touch_plant", False),
        "Touching Animal":       compliance.get("touch_animal", False),
        "Extended Plant Touch":  compliance.get("extended_touch_plant", False),
        "Extended Animal Touch": compliance.get("extended_touch_animal", False),
        "Plucking Plant":        compliance.get("plucking_plant", False),
        "Animal Strike":         compliance.get("animal_strike", False),
    }
    cols = st.columns(3)
    for i, (label, active) in enumerate(flags.items()):
        bg = "#ffe5e5" if active else "#e5ffe5"
        border = "red" if active else "green"
        tag = "ALERT" if active else "OK"
        cols[i % 3].markdown(
            f"<div style='padding:6px;border-radius:4px;background:{bg};"
            f"border-left:4px solid {border};margin-bottom:6px'>"
            f"<b>{tag}</b> {label}</div>",
            unsafe_allow_html=True,
        )
    c1, c2 = st.columns(2)
    c1.metric("Pluck Events", compliance.get("pluck_event_count", 0))
    c2.metric("Strike Events", compliance.get("strike_event_count", 0))


# ── Sidebar ───────────────────────────────────────────────────────────────────

with st.sidebar:
    st.header("Settings")
    server_url = st.text_input("Server WebSocket URL", value=DEFAULT_SERVER_URL)
    mode = st.radio("Input type", ["Image", "Video"])

st.caption(f"Server: `{server_url}`")

# ── Image mode ────────────────────────────────────────────────────────────────

if mode == "Image":
    files = st.file_uploader(
        "Upload one or more images",
        type=["jpg", "jpeg", "png", "bmp", "webp"],
        accept_multiple_files=True,
    )
    if files:
        for f in files:
            image = Image.open(f).convert("RGB")
            bgr = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)

            try:
                ws = open_ws(server_url)
                result = send_frame(ws, bgr)
                ws.close()
            except Exception as e:
                st.error(f"Could not reach server: {e}")
                continue

            annotated_bgr = draw_results(bgr, result.get("detections", []), result.get("poses", []), result.get("human_boxes", []))
            annotated_rgb = cv2.cvtColor(annotated_bgr, cv2.COLOR_BGR2RGB)

            col1, col2 = st.columns(2)
            with col1:
                st.subheader(f"Original — {f.name}")
                st.image(image, use_column_width=True)
            with col2:
                st.subheader("Detections")
                st.image(annotated_rgb, use_column_width=True)

            show_compliance(result.get("compliance", {}))

            if result.get("detections"):
                st.dataframe(result["detections"], use_container_width=True)
            else:
                st.info("No detections.")

            if result.get("inference_ms"):
                st.caption(f"Server inference: {result['inference_ms']} ms")
            st.divider()

# ── Video mode ────────────────────────────────────────────────────────────────

else:
    file = st.file_uploader("Upload a video", type=["mp4", "mov", "avi", "mkv", "webm"])
    if file:
        with tempfile.NamedTemporaryFile(
            delete=False, suffix=os.path.splitext(file.name)[1]
        ) as tmp_in:
            tmp_in.write(file.read())
            in_path = tmp_in.name

        cap = cv2.VideoCapture(in_path)
        if not cap.isOpened():
            st.error("Could not open the uploaded video.")
        else:
            fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
            width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT)) or 0

            out_path = os.path.join(
                tempfile.gettempdir(),
                f"detected_{os.path.basename(in_path)}.mp4",
            )
            writer = cv2.VideoWriter(
                out_path, cv2.VideoWriter_fourcc(*"mp4v"), fps, (width, height)
            )

            try:
                # One persistent WebSocket connection for the whole video so the
                # server's per-connection ComplianceEvaluator tracks state across frames
                ws = open_ws(server_url)
            except Exception as e:
                st.error(f"Could not reach server: {e}")
                cap.release()
                ws = None

            if ws is not None:
                preview = st.empty()
                compliance_placeholder = st.empty()
                progress = st.progress(0.0, text="Processing video...")
                frame_idx = 0
                last_compliance = {}

                while True:
                    ok, frame = cap.read()
                    if not ok:
                        break

                    result = send_frame(ws, frame)
                    last_compliance = result.get("compliance", {})
                    annotated = draw_results(
                        frame,
                        result.get("detections", []),
                        result.get("poses", []),
                        result.get("human_boxes", []),
                    )
                    writer.write(annotated)
                    frame_idx += 1

                    if frame_idx % max(1, int(fps)) == 0:
                        preview.image(
                            cv2.cvtColor(annotated, cv2.COLOR_BGR2RGB),
                            channels="RGB",
                            use_column_width=True,
                        )
                        with compliance_placeholder.container():
                            show_compliance(last_compliance)

                    if total_frames > 0:
                        progress.progress(
                            min(frame_idx / total_frames, 1.0),
                            text=f"Frame {frame_idx}/{total_frames}",
                        )

                ws.close()
                cap.release()
                writer.release()
                progress.progress(1.0, text="Done")

                st.subheader("Final Compliance Summary")
                show_compliance(last_compliance)

                with open(out_path, "rb") as vf:
                    video_bytes = vf.read()
                st.video(video_bytes)
                st.download_button(
                    "Download annotated video",
                    data=video_bytes,
                    file_name="detected.mp4",
                    mime="video/mp4",
                )
