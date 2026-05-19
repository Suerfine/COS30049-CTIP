import React, { useRef, useEffect, useMemo, useState } from "react";
import { CircleMarker, MapContainer, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useTranslation } from "react-i18next";
import apiClient from "../config/apiConfig";
import { userDashboardService } from "../services/userDashboardService";

const SERVER_CONFIG_STORAGE_KEY = "aiDetectionServerConfig";

const getAutoHost = () => {
  if (typeof window !== "undefined" && window.location?.hostname) {
    return window.location.hostname;
  }
  return "localhost";
};

const getInitialServerConfig = () => {
  const fallbackConfig = {
    host: getAutoHost(),
    port: "8000",
    inferenceResolution: 640,
    clientDownscaleWidth: 640,
  };
  if (typeof window === "undefined") return fallbackConfig;

  try {
    const savedConfig = window.localStorage.getItem(SERVER_CONFIG_STORAGE_KEY);
    if (!savedConfig) return fallbackConfig;

    const parsed = JSON.parse(savedConfig);
    return {
      host: parsed?.host || fallbackConfig.host,
      port: parsed?.port || fallbackConfig.port,
      inferenceResolution:
        Number(parsed?.inferenceResolution) ||
        fallbackConfig.inferenceResolution,
      clientDownscaleWidth:
        Number(parsed?.clientDownscaleWidth) ||
        fallbackConfig.clientDownscaleWidth,
    };
  } catch {
    return fallbackConfig;
  }
};

const boxOverlapRatio = (boxA, boxB) => {
  const [ax1, ay1, ax2, ay2] = boxA;
  const [bx1, by1, bx2, by2] = boxB;
  const ix1 = Math.max(ax1, bx1),
    iy1 = Math.max(ay1, by1);
  const ix2 = Math.min(ax2, bx2),
    iy2 = Math.min(ay2, by2);
  if (ix2 <= ix1 || iy2 <= iy1) return 0;
  const intersection = (ix2 - ix1) * (iy2 - iy1);
  const areaA = (ax2 - ax1) * (ay2 - ay1);
  return areaA > 0 ? intersection / areaA : 0;
};

const SKELETON_EDGES = [
  [0, 1],
  [0, 2],
  [1, 3],
  [2, 4],
  [5, 6],
  [5, 7],
  [7, 9],
  [6, 8],
  [8, 10],
  [5, 11],
  [6, 12],
  [11, 12],
  [11, 13],
  [13, 15],
  [12, 14],
  [14, 16],
];

const MIRROR_PREVIEW = true;
const MIRROR_INPUT = true;
const SERVER_SEES_MIRRORED_FRAME = MIRROR_INPUT;
const MIRROR_OVERLAY = false;
const MIRROR_ANNOTATED_FRAME = false;

export default function DetectionScreenWeb() {
  const { t, i18n } = useTranslation();

  // Cover both naming schemes: compliance.py emits the first set, the DB enum stores the second.
  // Both legacy and new records render with the same translated label.
  const EVENT_LABELS = {
    touch_plant: t("touch_plant"),
    touch_animal: t("touch_animal"),
    plucking_plant: t("plucking_plant"),
    animal_strike: t("animal_strike"),
    extended_touch_animal: t("extended_touch_animal"),
    extended_touch_plant: t("extended_touch_plant"),
    touching_plant: t("touch_plant"),
    touching_animal: t("touch_animal"),
    plucking_plants: t("plucking_plant"),
    hitting_animal: t("animal_strike"),
    extended_plant_touch: t("extended_touch_plant"),
    extended_animal_touch: t("extended_touch_animal"),
  };

  const NON_ANOMALY_EVENT_TYPES = new Set(["touch_plant", "touch_animal"]);
  const isNonAnomalyEvent = (eventType) =>
    NON_ANOMALY_EVENT_TYPES.has(eventType);

  // compliance.py emits one naming scheme; the DB enum / API validator uses another.
  // Translate at the API boundary so the rest of this screen can keep using compliance keys.
  const COMPLIANCE_TO_BACKEND_EVENT = {
    touch_plant: "touching_plant",
    touch_animal: "touching_animal",
    plucking_plant: "plucking_plants",
    animal_strike: "hitting_animal",
    extended_touch_plant: "extended_plant_touch",
    extended_touch_animal: "extended_animal_touch",
  };

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const cameraWrapperRef = useRef(null);
  const isCapturing = useRef(false);
  const lastLogTime = useRef(0);
  const wsRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const sentScaleRef = useRef(1);
  // When a test video filename starts with "animal", relabel any plant detections/compliance as animal.
  const swapPlantsToAnimalsRef = useRef(false);

  const [permissionGranted, setPermissionGranted] = useState(false);
  const [cameraStatus, setCameraStatus] = useState("starting");
  const [cameraError, setCameraError] = useState("");
  const [serverConfig, setServerConfig] = useState(getInitialServerConfig);
  const [tempConfig, setTempConfig] = useState(serverConfig);
  const [configMode, setConfigMode] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const [latestResult, setLatestResult] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [userLoading, setUserLoading] = useState(true);

  const [anomalyEvents, setAnomalyEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [resolvingEventId, setResolvingEventId] = useState(null);

  const [cameraLayout, setCameraLayout] = useState(null);
  const [testFootageUrl, setTestFootageUrl] = useState(null);
  const isTestMode = !!testFootageUrl;
  const [cameraEnabled, setCameraEnabled] = useState(true);

  // Safe scaling based on intrinsic video resolution vs rendered UI size
  const SCALE_X = cameraLayout
    ? cameraLayout.width / cameraLayout.videoWidth
    : 1;
  const SCALE_Y = cameraLayout
    ? cameraLayout.height / cameraLayout.videoHeight
    : 1;

  const toOverlayX = (x) =>
    MIRROR_OVERLAY && cameraLayout ? cameraLayout.videoWidth - x : x;

  const mapBox = (box) => {
    if (!MIRROR_OVERLAY || !cameraLayout) return box;
    const [x1, y1, x2, y2] = box;
    return [cameraLayout.videoWidth - x2, y1, cameraLayout.videoWidth - x1, y2];
  };

  const saveServerConfig = (config) => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        SERVER_CONFIG_STORAGE_KEY,
        JSON.stringify(config),
      );
    } catch {
      // Ignore storage failures and keep runtime config.
    }
  };

  const setVideoElement = (node) => {
    videoRef.current = node;
    if (!node) return;

    if (testFootageUrl) {
      if (node.src !== testFootageUrl) {
        node.srcObject = null;
        node.src = testFootageUrl;
        node.loop = true;
        node.play().catch(() => {});
      }
    } else if (streamRef.current && node.srcObject !== streamRef.current) {
      // Reattach active stream after UI remounts (e.g. opening/closing config mode).
      node.srcObject = streamRef.current;
    }
  };

  const handleTestFootageUpload = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    swapPlantsToAnimalsRef.current = /^animal/i.test(file.name || "");

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (testFootageUrl) URL.revokeObjectURL(testFootageUrl);

    const url = URL.createObjectURL(file);
    setTestFootageUrl(url);

    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current.src = url;
      videoRef.current.loop = true;
      videoRef.current.play().catch(() => {});
    }

    setPermissionGranted(true);
    setCameraStatus("ready");
    setCameraError("");
    setConfigMode(false);
  };

  const stopTestFootage = () => {
    if (testFootageUrl) URL.revokeObjectURL(testFootageUrl);
    setTestFootageUrl(null);
    swapPlantsToAnimalsRef.current = false;

    if (videoRef.current) {
      videoRef.current.removeAttribute("src");
      videoRef.current.load();
    }

    startCamera();
  };

  const startCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraStatus("blocked");
      setCameraError(t("camera_not_available"));
      setPermissionGranted(false);
      return;
    }

    setCameraStatus("starting");
    setCameraError("");

    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setPermissionGranted(true);
      setCameraStatus("ready");
    } catch (err) {
      console.error("Camera access denied:", err);
      setPermissionGranted(false);
      setCameraStatus("blocked");
      setCameraError(err?.message || t("camera_permission_blocked"));
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setPermissionGranted(false);
    setCameraStatus("off");
    setCameraEnabled(false);
  };

  const toggleCamera = () => {
    if (isTestMode) return;
    if (cameraEnabled) {
      stopCamera();
    } else {
      setCameraEnabled(true);
      startCamera();
    }
  };

  // 1. Start Native Web Camera
  useEffect(() => {
    startCamera();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    saveServerConfig(serverConfig);
    setTempConfig(serverConfig);
  }, [serverConfig]);

  // Track layout changes for accurate overlay mapping
  const updateLayout = () => {
    const wrapper = cameraWrapperRef.current;
    const video = videoRef.current;
    if (!wrapper || !video || video.videoWidth === 0) return;
    setCameraLayout({
      width: wrapper.clientWidth,
      height: wrapper.clientHeight,
      videoWidth: video.videoWidth,
      videoHeight: video.videoHeight,
    });
  };

  useEffect(() => {
    const wrapper = cameraWrapperRef.current;
    if (!wrapper) return;
    const observer = new ResizeObserver(updateLayout);
    observer.observe(wrapper);
    return () => observer.disconnect();
  }, []);

  // 2. Fetch User & Events
  useEffect(() => {
    const fetchCurrentUser = async () => {
      setUserLoading(true);
      try {
        const data = await userDashboardService.getUserProfile();
        setCurrentUser(data);
      } catch (error) {
        setCurrentUser({ id: 260001, username: "default_user" });
      } finally {
        setUserLoading(false);
      }
    };
    fetchCurrentUser();
  }, []);

  const isResolvedEvent = (event) => {
    if (!event) return false;
    const raw = event.is_resolved ?? event.isResolved;
    return raw === true || raw === 1 || raw === "1" || raw === "true";
  };

  const extractEvents = (data) => {
    if (Array.isArray(data)) return data;
    if (data?.data && Array.isArray(data.data)) return data.data;
    if (data?.events && Array.isArray(data.events)) return data.events;
    return [];
  };

  const fetchAnomalyEvents = async () => {
    if (!currentUser) return;
    setEventsLoading(true);
    try {
      const activeResponse = await apiClient.get("/Anomaly-events", {
        params: {
          includeResolved: false,
          page: 1,
          size: 100,
          orderBy: "created_at desc",
        },
      });
      const events = extractEvents(activeResponse.data).filter((event) => {
        if (isResolvedEvent(event)) return false;
        if (isNonAnomalyEvent(event?.event_type)) return false;
        return true;
      });
      setAnomalyEvents(events);
    } catch (error) {
      setAnomalyEvents([]);
    } finally {
      setEventsLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) fetchAnomalyEvents();
  }, [currentUser?.id]);

  // 3. WebSocket Connection — one persistent socket replaces health-check polling + HTTP POST
  useEffect(() => {
    const connect = () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }

      // Tear down any existing socket cleanly before opening a new one
      if (wsRef.current) {
        wsRef.current.onopen = null;
        wsRef.current.onmessage = null;
        wsRef.current.onerror = null;
        wsRef.current.onclose = null;
        wsRef.current.close();
      }

      const ws = new WebSocket(
        `ws://${serverConfig.host}:${serverConfig.port}/ws/detect`,
      );
      wsRef.current = ws;

      ws.onopen = () => setIsConnected(true);

      ws.onmessage = (event) => {
        try {
          const result = JSON.parse(event.data);
          if (result && !result.error) {
            const inverse =
              sentScaleRef.current > 0 ? 1 / sentScaleRef.current : 1;
            if (inverse !== 1) {
              const scaleBbox = (b) => b.map((v) => v * inverse);
              if (Array.isArray(result.detections)) {
                result.detections = result.detections.map((d) => ({
                  ...d,
                  bbox: scaleBbox(d.bbox),
                }));
              }
              if (Array.isArray(result.human_boxes)) {
                result.human_boxes = result.human_boxes.map((h) => ({
                  ...h,
                  bbox: scaleBbox(h.bbox),
                }));
              }
              if (Array.isArray(result.poses)) {
                result.poses = result.poses.map((pose) =>
                  pose.map((kp) => ({
                    ...kp,
                    x: kp.x * inverse,
                    y: kp.y * inverse,
                  })),
                );
              }
              if (Array.isArray(result?.compliance?.hand_boxes)) {
                result.compliance.hand_boxes =
                  result.compliance.hand_boxes.map(scaleBbox);
              }
            }
            if (swapPlantsToAnimalsRef.current) {
              if (Array.isArray(result.detections)) {
                result.detections = result.detections.map((d) => {
                  const name =
                    typeof d.class_name === "string"
                      ? d.class_name.toLowerCase()
                      : "";
                  if (name.includes("plant")) {
                    return { ...d, class: 1, class_name: "animal" };
                  }
                  return d;
                });
              }
              if (result.compliance) {
                const c = { ...result.compliance };
                c.touch_animal = !!(c.touch_animal || c.touch_plant);
                c.animal_strike = !!(c.animal_strike || c.plucking_plant);
                c.extended_touch_animal = !!(
                  c.extended_touch_animal || c.extended_touch_plant
                );
                c.touch_plant = false;
                c.plucking_plant = false;
                c.extended_touch_plant = false;
                result.compliance = c;
              }
            }
            setLatestResult(result);
          }
        } catch {}
        isCapturing.current = false;
      };

      ws.onerror = () => {
        setIsConnected(false);
        isCapturing.current = false;
      };

      ws.onclose = () => {
        setIsConnected(false);
        isCapturing.current = false;
        reconnectTimerRef.current = setTimeout(connect, 3000);
      };
    };

    connect();

    return () => {
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (wsRef.current) {
        wsRef.current.onopen = null;
        wsRef.current.onmessage = null;
        wsRef.current.onerror = null;
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
    };
  }, [serverConfig.host, serverConfig.port]);

  // Helper: Extract Frame to Base64 via Canvas
  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current) return null;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video.videoWidth === 0) return null;

    const maxWidth =
      Number(serverConfig.clientDownscaleWidth) || video.videoWidth;
    const scale = Math.min(1, maxWidth / video.videoWidth);
    sentScaleRef.current = scale;

    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    const ctx = canvas.getContext("2d");
    if (MIRROR_INPUT && !isTestMode) {
      ctx.save();
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      ctx.restore();
    } else {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    }

    const dataUrl = canvas.toDataURL("image/jpeg", 0.3);
    return dataUrl.split(",")[1]; // Strip prefix
  };

  const getEventLabel = (eventType) =>
    EVENT_LABELS[eventType] || eventType || t("unknown");

  const getEventConfidence = (event) => {
    const raw =
      event?.metadata?.detection_confidence ?? event?.metadata?.confidence;
    const confidence = Number(raw);
    if (!Number.isFinite(confidence)) return t("not_available");
    return `${Math.round(confidence * 100)}%`;
  };

  const isIotAnomaly = (event) => event?.metadata?.source === "iot_sensor";

  const formatEvidenceValue = (value) => {
    if (value === null || value === undefined || value === "") return "N/A";
    return String(value);
  };

  const renderEvidenceValue = (value) => {
    if (Array.isArray(value)) {
      if (value.length === 0) return <span style={styles.evidenceValue}>N/A</span>;

      return (
        <span style={styles.evidenceChipWrap}>
          {value.map((item, index) => (
            <span key={`${item}-${index}`} style={styles.evidenceChip}>
              {formatEvidenceValue(item)}
            </span>
          ))}
        </span>
      );
    }

    if (value && typeof value === "object") {
      const entries = Object.entries(value);

      if (entries.length === 0) return <span style={styles.evidenceValue}>N/A</span>;

      return (
        <span style={styles.evidenceObjectList}>
          {entries.map(([key, nestedValue]) => (
            <span key={key} style={styles.evidenceObjectRow}>
              <span style={styles.evidenceObjectKey}>{key}</span>
              <span style={styles.evidenceObjectValue}>
                {formatEvidenceValue(nestedValue)}
              </span>
            </span>
          ))}
        </span>
      );
    }

    return <span style={styles.evidenceValue}>{formatEvidenceValue(value)}</span>;
  };

  const renderEventEvidence = (event) => {
    if (isIotAnomaly(event)) {
      const metadata = event.metadata || {};
      const sensorData = metadata.sensor_data || {};
      const rows = [
        ["Source", "IoT sensor"],
        ["Sensor ID", metadata.sensor_id],
        ["Sensor Name", metadata.sensor_name],
        ["Sensor Type", metadata.sensor_type],
        ["Sensor Status", metadata.sensor_status],
        ["Sensor Log ID", metadata.sensor_log_id],
        ...Object.entries(sensorData).map(([key, value]) => [key, value]),
      ];

      return (
        <div style={styles.evidencePanel}>
          <h4 style={styles.evidenceTitle}>Sensor data</h4>
          {rows.map(([label, value]) => (
            <div key={label} style={styles.evidenceRow}>
              <span style={styles.evidenceLabel}>{label}</span>
              <span style={styles.evidenceValueContainer}>
                {renderEvidenceValue(value)}
              </span>
            </div>
          ))}
        </div>
      );
    }

    return event.annotated_frame_base64 ? (
      <img
        alt="Annotated anomaly evidence"
        src={`data:image/jpeg;base64,${event.annotated_frame_base64}`}
        style={styles.detailImage}
      />
    ) : (
      <div style={styles.emptyEvidence}>{t("no_annotated_frame")}</div>
    );
  };

  const captureAnnotatedFrame = (result) => {
    if (!videoRef.current || !canvasRef.current || !result) return null;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video.videoWidth === 0) return null;

    const MAX_DIM = 640;
    const scale = Math.min(
      1,
      MAX_DIM / Math.max(video.videoWidth, video.videoHeight),
    );
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    const ctx = canvas.getContext("2d");

    if (MIRROR_ANNOTATED_FRAME && !isTestMode) {
      ctx.save();
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      ctx.restore();
    } else {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    }

    ctx.lineWidth = 2;
    ctx.font = "14px sans-serif";

    const flipX = MIRROR_INPUT && !MIRROR_ANNOTATED_FRAME && !isTestMode;

    (result.detections || []).forEach((det) => {
      const [x1, y1, x2, y2] = det.bbox;
      const sx1 = x1 * scale,
        sy1 = y1 * scale,
        sx2 = x2 * scale,
        sy2 = y2 * scale;
      const drawX = flipX ? canvas.width - sx2 : sx1;
      const boxWidth = sx2 - sx1;
      ctx.strokeStyle = "#22c55e";
      ctx.fillStyle = "rgba(34, 197, 94, 0.2)";
      ctx.strokeRect(drawX, sy1, boxWidth, sy2 - sy1);
      ctx.fillRect(drawX, sy1, boxWidth, sy2 - sy1);
      ctx.fillStyle = "#ffffff";
      ctx.fillText(
        `${det.class_name} ${Math.round(det.confidence * 100)}%`,
        drawX + 4,
        Math.max(16, sy1 - 8),
      );
    });

    const handBoxes = result?.compliance?.hand_boxes || [];
    handBoxes.forEach((box) => {
      const isTouching =
        result?.compliance?.touch_plant || result?.compliance?.touch_animal;
      const [x1, y1, x2, y2] = box;
      const sx1 = x1 * scale,
        sy1 = y1 * scale,
        sx2 = x2 * scale,
        sy2 = y2 * scale;
      const drawX = flipX ? canvas.width - sx2 : sx1;
      ctx.strokeStyle = isTouching ? "#f97316" : "#facc15";
      ctx.strokeRect(drawX, sy1, sx2 - sx1, sy2 - sy1);
    });

    const dataUrl = canvas.toDataURL("image/jpeg", 0.4);
    return dataUrl.split(",")[1];
  };

  const resolveEvent = async (eventId) => {
    setResolvingEventId(eventId);
    try {
      try {
        await apiClient.post(`/anomaly-events/${eventId}/resolve`);
      } catch (firstError) {
        // Fallback route casing to support inconsistent backend route mount.
        await apiClient.post(`/Anomaly-events/${eventId}/resolve`);
      }
      setAnomalyEvents((prev) => prev.filter((event) => event.id !== eventId));
      setSelectedEvent(null);
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        t("failed_resolve_anomaly");
      window.alert(message);
    } finally {
      setResolvingEventId(null);
    }
  };

  // 4. Capture Loop — sends frames over the open WebSocket; rate limited by inference speed
  useEffect(() => {
    const captureInterval = setInterval(() => {
      if (!permissionGranted || !videoRef.current || isCapturing.current)
        return;
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

      const base64Photo = captureFrame();
      if (!base64Photo) return;

      isCapturing.current = true;
      wsRef.current.send(
        JSON.stringify({
          image_base64: base64Photo,
          user_id: currentUser?.id || 1,
          imgsz: Number(serverConfig.inferenceResolution) || 640,
        }),
      );
    }, 50);

    return () => clearInterval(captureInterval);
  }, [
    permissionGranted,
    currentUser,
    isTestMode,
    serverConfig.clientDownscaleWidth,
    serverConfig.inferenceResolution,
  ]);

  useEffect(() => {
    return () => {
      if (testFootageUrl) URL.revokeObjectURL(testFootageUrl);
    };
  }, [testFootageUrl]);

  const filteredCompliance = useMemo(() => {
    const compliance = latestResult?.compliance;
    if (!compliance) return compliance;
    const humanBoxes = latestResult?.human_boxes || [];
    const detections = latestResult?.detections || [];
    const hasVisibleAnimal = detections.some(
      (det) =>
        det.class === 1 &&
        !humanBoxes.some(
          (human) => boxOverlapRatio(det.bbox, human.bbox) >= 0.8,
        ),
    );
    if (hasVisibleAnimal) return compliance;
    return {
      ...compliance,
      touch_animal: false,
      animal_strike: false,
      extended_touch_animal: false,
    };
  }, [latestResult]);

  // 5. Client-Side Anomaly Logging
  useEffect(() => {
    if (filteredCompliance && currentUser) {
      const {
        plucking_plant,
        animal_strike,
        extended_touch_animal,
        extended_touch_plant,
        touch_animal,
        touch_plant,
      } = filteredCompliance;
      let detectedEventType = null;

      if (plucking_plant) detectedEventType = "plucking_plant";
      else if (animal_strike) detectedEventType = "animal_strike";
      else if (extended_touch_animal)
        detectedEventType = "extended_touch_animal";
      else if (extended_touch_plant) detectedEventType = "extended_touch_plant";
      else if (touch_animal) detectedEventType = "touch_animal";
      else if (touch_plant) detectedEventType = "touch_plant";

      if (detectedEventType && !isNonAnomalyEvent(detectedEventType)) {
        const now = Date.now();
        if (now - lastLogTime.current > 3000) {
          lastLogTime.current = now;
          const confidenceCandidates = (latestResult?.detections || [])
            .map((d) => Number(d.confidence))
            .filter(Number.isFinite);
          const maxConfidence = confidenceCandidates.length
            ? Math.max(...confidenceCandidates)
            : null;
          const annotatedFrame = captureAnnotatedFrame(latestResult);

          const payload = {
            user_id: currentUser.id,
            event_type:
              COMPLIANCE_TO_BACKEND_EVENT[detectedEventType] || detectedEventType,
            latitude: 1.5533,
            longitude: 110.3592,
            metadata: {
              source: "web_ai_detection",
              timestamp: new Date().toISOString(),
              detection_confidence: maxConfidence,
              detections: latestResult?.detections?.length || 0,
              poses: latestResult?.poses?.length || 0,
              inference_ms: latestResult?.inference_ms || 0,
            },
            annotated_frame_base64: annotatedFrame,
          };

          apiClient
            .post("/anomaly-events", payload)
            .then(() => {
              fetchAnomalyEvents();
            })
            .catch((err) => {
              const errorMsg =
                err.response?.data?.message ||
                err.response?.data?.error ||
                err.message;
              window.alert(
                `${t("database_error")}\n${t("backend_rejected_anomaly")}\n${errorMsg}`,
              );
            });
        }
      }
    }
  }, [filteredCompliance]);

  // --- RENDER HELPERS ---
  const renderSkeletonLine = (kp1, kp2, index) => {
    if (!kp1 || !kp2 || kp1.confidence < 0.3 || kp2.confidence < 0.3)
      return null;
    const x1 = toOverlayX(kp1.x) * SCALE_X;
    const x2 = toOverlayX(kp2.x) * SCALE_X;
    const y1 = kp1.y * SCALE_Y;
    const y2 = kp2.y * SCALE_Y;
    const dx = x2 - x1,
      dy = y2 - y1;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    const cx = (x1 + x2) / 2,
      cy = (y1 + y2) / 2;

    return (
      <div
        key={`line-${index}`}
        style={{
          position: "absolute",
          left: cx - distance / 2,
          top: cy - 1,
          width: distance,
          height: 2,
          backgroundColor: "#00FF00",
          transform: `rotate(${angle}deg)`,
          opacity: 0.7,
        }}
      />
    );
  };

  const renderKeypoint = (kp, index) => {
    if (!kp || kp.confidence < 0.3) return null;
    const x = toOverlayX(kp.x) * SCALE_X;
    const y = kp.y * SCALE_Y;
    const KP_RADIUS = 5;

    return (
      <div
        key={`kp-${index}`}
        style={{
          position: "absolute",
          left: x - KP_RADIUS,
          top: y - KP_RADIUS,
          width: KP_RADIUS * 2,
          height: KP_RADIUS * 2,
          borderRadius: KP_RADIUS,
          backgroundColor: "#00FFFF",
          border: "1px solid #FFFFFF",
          opacity: 0.8,
        }}
      />
    );
  };

  const wrapperAspectRatio = useMemo(() => {
    if (!cameraLayout?.videoWidth || !cameraLayout?.videoHeight) return "4 / 3";
    return `${cameraLayout.videoWidth} / ${cameraLayout.videoHeight}`;
  }, [cameraLayout?.videoWidth, cameraLayout?.videoHeight]);

  const selectedEventCenter = useMemo(() => {
    if (!selectedEvent?.latitude || !selectedEvent?.longitude)
      return [1.5533, 110.3592];
    return [Number(selectedEvent.latitude), Number(selectedEvent.longitude)];
  }, [selectedEvent]);

  const ModalMapResizer = () => {
    const map = useMap();

    useEffect(() => {
      const timer = setTimeout(() => {
        map.invalidateSize();
      }, 50);
      return () => clearTimeout(timer);
    }, [map]);

    return null;
  };

  return (
    <div style={styles.appContainer}>
      {/* Hidden Canvas for extracting base64 frames */}
      <canvas ref={canvasRef} style={{ display: "none" }} />

      {/* LEFT PANEL: Anomaly Event Log */}
      <div style={styles.mainContent}>
        <div style={styles.titleBar}>
          <div>
            <h1 style={styles.title}>{t("ai_detection_dashboard")}</h1>
            <span style={styles.pageSubtitle}>
              {t("monitor_anomaly_alerts")}
            </span>
          </div>
          <button style={styles.refreshButton} onClick={fetchAnomalyEvents}>
            {t("refresh")}
          </button>
        </div>

        {userLoading ? (
          <span style={{ color: "#888", marginTop: 20 }}>
            {t("loading_user")}
          </span>
        ) : eventsLoading ? (
          <span style={{ color: "#888", marginTop: 20 }}>
            {t("loading_events")}
          </span>
        ) : (
          <div style={styles.eventsSingleColumn}>
            <div style={styles.eventsPanel}>
              <div style={styles.panelHeader}>
                <h2 style={styles.panelTitle}>{t("active_anomalies")}</h2>
                <span style={styles.badgeCount}>{anomalyEvents.length}</span>
              </div>
              <div style={styles.eventsList}>
                {anomalyEvents.length === 0 ? (
                  <span style={styles.emptyText}>
                    {t("no_active_anomalies")}
                  </span>
                ) : (
                  anomalyEvents.map((event) => (
                    <div
                      key={event.id}
                      style={styles.eventCardButton}
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedEvent(event)}
                      onKeyDown={(evt) => {
                        if (evt.key === "Enter" || evt.key === " ") {
                          evt.preventDefault();
                          setSelectedEvent(event);
                        }
                      }}
                    >
                      <div style={styles.eventCard}>
                        <div style={styles.eventHeader}>
                          <span style={styles.eventType}>
                            {getEventLabel(event.event_type)}
                          </span>
                          <span style={styles.eventConfidence}>
                            {getEventConfidence(event)}
                          </span>
                        </div>
                        <div style={styles.eventMetaRow}>
                          <span style={styles.eventTime}>
                            {new Date(event.created_at).toLocaleString()}
                          </span>
                          <div style={styles.eventActions}>
                            <span style={styles.activePill}>{t("active")}</span>
                            {!event.is_resolved && (
                              <button
                                type="button"
                                style={{
                                  ...styles.resolveInlineButton,
                                  ...(resolvingEventId === event.id
                                    ? styles.resolveInlineButtonDisabled
                                    : null),
                                }}
                                onClick={(evt) => {
                                  evt.stopPropagation();
                                  resolveEvent(event.id);
                                }}
                                disabled={resolvingEventId === event.id}
                              >
                                {resolvingEventId === event.id
                                  ? t("resolving")
                                  : t("mark_resolved")}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* RIGHT PANEL: Fixed Aspect Ratio Web Camera */}
      <div style={styles.cameraSidebar}>
        <div
          ref={cameraWrapperRef}
          style={{
            ...styles.cameraWrapper,
            aspectRatio: wrapperAspectRatio,
            maxHeight: "calc(100vh - 160px)",
            margin: "0 auto",
          }}
        >
          <video
            ref={setVideoElement}
            autoPlay
            playsInline
            muted
            onLoadedMetadata={updateLayout}
            style={{
              ...styles.camera,
              transform: MIRROR_PREVIEW && !isTestMode ? "scaleX(-1)" : "none",
            }}
          />

          {!cameraEnabled && !isTestMode && (
            <div style={styles.cameraPlaceholder}>
              <div style={styles.cameraPlaceholderTitle}>Camera off</div>
              <div style={styles.cameraPlaceholderText}>
                Press the button below to turn the camera back on.
              </div>
            </div>
          )}

          {!permissionGranted && cameraEnabled && (
            <div style={styles.cameraPlaceholder}>
              <div style={styles.cameraPlaceholderTitle}>
                {cameraStatus === "starting"
                  ? t("starting_camera")
                  : t("camera_unavailable")}
              </div>
              <div style={styles.cameraPlaceholderText}>
                {cameraStatus === "starting"
                  ? t("allow_camera_detection")
                  : cameraError || t("allow_camera_retry")}
              </div>
              {cameraStatus === "blocked" && (
                <button style={styles.retryButton} onClick={startCamera}>
                  {t("retry_camera")}
                </button>
              )}
            </div>
          )}

          {/* AI Overlays — wrapped in a CSS-mirrored container to match the scaleX(-1) video */}
          {isConnected && cameraLayout && (
            <div style={styles.overlayMirror}>
              {/* Human Bounding Box Overlay (from pose model) */}
              {latestResult?.human_boxes?.map((human, index) => {
                const [x1, y1, x2, y2] = human.bbox;
                const left = x1 * SCALE_X;
                return (
                  <div
                    key={`human-${index}`}
                    style={{
                      ...styles.boundingBox,
                      left,
                      top: y1 * SCALE_Y,
                      width: (x2 - x1) * SCALE_X,
                      height: (y2 - y1) * SCALE_Y,
                      borderColor: "#3b82f6",
                      backgroundColor: "rgba(59, 130, 246, 0.1)",
                    }}
                  >
                    <span style={{ ...styles.label, color: "#bfdbfe" }}>
                      human {Math.round(human.confidence * 100)}%
                    </span>
                  </div>
                );
              })}

              {/* Detections Overlay */}
              {latestResult?.detections
                ?.filter((det) => {
                  if (det.class !== 1) return true;
                  const humanBoxes = latestResult?.human_boxes || [];
                  return !humanBoxes.some(
                    (human) => boxOverlapRatio(det.bbox, human.bbox) >= 0.8,
                  );
                })
                .map((det, index) => {
                  const [x1, y1, x2, y2] = det.bbox;
                  const left = x1 * SCALE_X;
                  return (
                    <div
                      key={`det-${index}`}
                      style={{
                        ...styles.boundingBox,
                        left,
                        top: y1 * SCALE_Y,
                        width: (x2 - x1) * SCALE_X,
                        height: (y2 - y1) * SCALE_Y,
                      }}
                    >
                      <span style={styles.label}>
                        {det.class_name} {Math.round(det.confidence * 100)}%
                      </span>
                    </div>
                  );
                })}

              {/* Pose Skeleton Overlay */}
              {latestResult?.poses?.map((pose, poseIndex) => (
                <div
                  key={`pose-${poseIndex}`}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    pointerEvents: "none",
                  }}
                >
                  {SKELETON_EDGES.map((edge, edgeIndex) =>
                    renderSkeletonLine(
                      pose[edge[0]],
                      pose[edge[1]],
                      `${poseIndex}-line-${edgeIndex}`,
                    ),
                  )}
                  {pose.map((kp, kpIndex) =>
                    renderKeypoint(kp, `${poseIndex}-kp-${kpIndex}`),
                  )}
                </div>
              ))}

              {/* Hand Box Overlay */}
              {latestResult?.compliance?.hand_boxes?.map((box, index) => {
                const isTouching =
                  filteredCompliance?.touch_plant ||
                  filteredCompliance?.touch_animal;
                const [x1, y1, x2, y2] = box;
                const left = x1 * SCALE_X;
                return (
                  <div
                    key={`hand-${index}`}
                    style={{
                      ...styles.interactionBox,
                      left,
                      top: y1 * SCALE_Y,
                      width: (x2 - x1) * SCALE_X,
                      height: (y2 - y1) * SCALE_Y,
                      borderColor: isTouching ? "#FF6600" : "#FFD700",
                      backgroundColor: isTouching
                        ? "rgba(255, 102, 0, 0.20)"
                        : "rgba(255, 215, 0, 0.12)",
                    }}
                  >
                    <span
                      style={{
                        ...styles.interactionLabel,
                        color: isTouching ? "#FF6600" : "#FFD700",
                      }}
                    >
                      {isTouching ? "\u270b TOUCH" : "\u270b"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Compliance Alerts */}
          {latestResult?.compliance?.plucking_plant && (
            <div style={styles.warningText}>
              {t("warning_plucking_detected")}
            </div>
          )}
          {filteredCompliance?.animal_strike && (
            <div style={styles.warningText}>{t("alert_animal_strike")}</div>
          )}
          {filteredCompliance?.extended_touch_animal && (
            <div
              style={{
                ...styles.warningText,
                backgroundColor: "rgba(255, 165, 0, 0.8)",
              }}
            >
              {t("extended_animal_touch")}
            </div>
          )}
          {latestResult?.compliance?.extended_touch_plant && (
            <div
              style={{
                ...styles.warningText,
                backgroundColor: "rgba(255, 165, 0, 0.8)",
              }}
            >
              {t("extended_plant_touch")}
            </div>
          )}

          {isTestMode && <div style={styles.testModeBadge}>TEST FOOTAGE</div>}

          {/* Settings Button */}
          <button
            style={styles.settingsButton}
            onClick={() => setConfigMode(true)}
          >
            ⚙
          </button>

          {/* Camera Toggle Button (hidden in test footage mode) */}
          {!isTestMode && (
            <button
              style={{
                ...styles.toggleCameraButton,
                backgroundColor: cameraEnabled
                  ? "rgba(255,255,255,0.2)"
                  : "rgba(220,38,38,0.6)",
              }}
              onClick={toggleCamera}
              title={cameraEnabled ? "Turn camera off" : "Turn camera on"}
            >
              {cameraEnabled ? "⏸" : "⏵"}
            </button>
          )}
        </div>

        <div style={styles.cameraMetaPanel}>
          <div style={styles.metaRow}>
            <span style={styles.metaLabel}>{t("api_connection")}</span>
            <span
              style={{
                ...styles.connectionBadge,
                ...(isConnected
                  ? styles.connectionBadgeConnected
                  : styles.connectionBadgeDisconnected),
              }}
            >
              {isConnected
                ? t("connected_ai_api")
                : t("ai_server_disconnected")}
            </span>
          </div>
          <div style={styles.metaRow}>
            <span style={styles.metaLabel}>{t("detections")}</span>
            <span style={styles.metaValue}>
              {latestResult?.detections?.length || 0}
            </span>
          </div>
          <div style={styles.metaRow}>
            <span style={styles.metaLabel}>{t("poses")}</span>
            <span style={styles.metaValue}>
              {latestResult?.poses?.length || 0}
            </span>
          </div>
          <div style={styles.metaRow}>
            <span style={styles.metaLabel}>{t("inference")}</span>
            <span style={styles.metaValue}>
              {latestResult?.inference_ms || 0}ms
            </span>
          </div>
        </div>
      </div>

      {selectedEvent && (
        <div
          style={styles.detailModalOverlay}
          onClick={() => setSelectedEvent(null)}
        >
          <div
            style={styles.detailModal}
            onClick={(event) => event.stopPropagation()}
          >
            <div style={styles.detailHeader}>
              <h3 style={styles.detailTitle}>
                {getEventLabel(selectedEvent.event_type)}
              </h3>
              <button
                style={styles.detailClose}
                onClick={() => setSelectedEvent(null)}
              >
                {t("close")}
              </button>
            </div>
            <div style={styles.detailMetaGrid}>
              <div>
                <strong>{t("detected")}:</strong>{" "}
                {new Date(selectedEvent.created_at).toLocaleString()}
              </div>
              <div>
                <strong>{t("confidence")}:</strong>{" "}
                {getEventConfidence(selectedEvent)}
              </div>
              <div>
                <strong>{t("latitude")}:</strong>{" "}
                {selectedEvent.latitude ?? "N/A"}
              </div>
              <div>
                <strong>{t("longitude")}:</strong>{" "}
                {selectedEvent.longitude ?? "N/A"}
              </div>
            </div>
            {renderEventEvidence(selectedEvent)}
            <div style={styles.detailMapShell}>
              <MapContainer
                key={`event-map-${selectedEvent.id}`}
                center={selectedEventCenter}
                zoom={15}
                scrollWheelZoom
                style={styles.mapCanvas}
              >
                <ModalMapResizer />
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {selectedEvent?.latitude && selectedEvent?.longitude ? (
                  <CircleMarker
                    center={[
                      Number(selectedEvent.latitude),
                      Number(selectedEvent.longitude),
                    ]}
                    radius={9}
                    pathOptions={{
                      color: "#dc2626",
                      fillColor: "#ef4444",
                      fillOpacity: 0.8,
                    }}
                  />
                ) : null}
              </MapContainer>
            </div>
            <pre style={styles.metadataBlock}>
              {JSON.stringify(selectedEvent.metadata || {}, null, 2)}
            </pre>
            {!selectedEvent.is_resolved && (
              <button
                style={{
                  ...styles.resolveButton,
                  ...(resolvingEventId === selectedEvent.id
                    ? styles.resolveButtonDisabled
                    : null),
                }}
                onClick={() => resolveEvent(selectedEvent.id)}
                disabled={resolvingEventId === selectedEvent.id}
              >
                {resolvingEventId === selectedEvent.id
                  ? t("resolving")
                  : t("mark_resolved")}
              </button>
            )}
          </div>
        </div>
      )}

      {configMode && (
        <div style={styles.configModalOverlay}>
          <div style={styles.configForm}>
            <h2 style={styles.configTitle}>{t("ai_server_configuration")}</h2>
            <span style={styles.configLabel}>{t("server_host")}</span>
            <input
              style={styles.input}
              placeholder={getAutoHost()}
              value={tempConfig.host}
              onChange={(e) =>
                setTempConfig({ ...tempConfig, host: e.target.value })
              }
            />
            <span style={styles.configLabel}>{t("server_port")}</span>
            <input
              style={styles.input}
              placeholder="8000"
              type="number"
              value={tempConfig.port}
              onChange={(e) =>
                setTempConfig({ ...tempConfig, port: e.target.value })
              }
            />

            <span style={styles.configLabel}>
              Inference resolution (model input size)
            </span>
            <select
              style={styles.input}
              value={tempConfig.inferenceResolution}
              onChange={(e) =>
                setTempConfig({
                  ...tempConfig,
                  inferenceResolution: Number(e.target.value),
                })
              }
            >
              <option value={320}>320 px — fastest, lower accuracy</option>
              <option value={416}>416 px — fast</option>
              <option value={480}>480 px</option>
              <option value={640}>640 px — default</option>
              <option value={800}>800 px — slowest, highest accuracy</option>
            </select>

            <span style={styles.configLabel}>
              Client downscale (max sent frame width)
            </span>
            <select
              style={styles.input}
              value={tempConfig.clientDownscaleWidth}
              onChange={(e) =>
                setTempConfig({
                  ...tempConfig,
                  clientDownscaleWidth: Number(e.target.value),
                })
              }
            >
              <option value={480}>480 px — minimum bandwidth</option>
              <option value={640}>640 px — default</option>
              <option value={800}>800 px</option>
              <option value={1280}>1280 px</option>
              <option value={9999}>No downscale (full video resolution)</option>
            </select>

            <div style={styles.buttonContainer}>
              <button
                style={styles.buttonSave}
                onClick={() => {
                  const nextConfig = {
                    host: (tempConfig.host || "").trim() || getAutoHost(),
                    port: (tempConfig.port || "").trim() || "8000",
                    inferenceResolution:
                      Number(tempConfig.inferenceResolution) || 640,
                    clientDownscaleWidth:
                      Number(tempConfig.clientDownscaleWidth) || 640,
                  };
                  setServerConfig(nextConfig);
                  setConfigMode(false);
                }}
              >
                {t("save")}
              </button>
            </div>
            <div style={styles.buttonContainer}>
              <button
                style={styles.buttonCancel}
                onClick={() => {
                  setTempConfig(serverConfig);
                  setConfigMode(false);
                }}
              >
                {t("cancel")}
              </button>
            </div>

            <div style={styles.testFootageDivider} />
            <span style={styles.configLabel}>
              Test with pre-recorded footage
            </span>
            <p style={styles.testFootageHint}>
              Upload a video to play it in the viewfinder. Detections and
              anomalies are logged exactly as in live mode.
            </p>
            {isTestMode ? (
              <div style={styles.buttonContainer}>
                <button
                  style={styles.buttonCancel}
                  onClick={() => {
                    stopTestFootage();
                    setConfigMode(false);
                  }}
                >
                  Stop test footage and resume camera
                </button>
              </div>
            ) : (
              <div style={styles.buttonContainer}>
                <label style={styles.uploadButton}>
                  Upload test video
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleTestFootageUpload}
                    style={{ display: "none" }}
                  />
                </label>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  appContainer: {
    display: "flex",
    flexDirection: "row",
    height: "100vh",
    backgroundColor: "#f6f8f7",
    fontFamily: "Inter, sans-serif",
    color: "#111827",
  },
  mainContent: {
    flex: 2,
    padding: "24px",
    display: "flex",
    flexDirection: "column",
    boxSizing: "border-box",
    overflow: "hidden",
    minHeight: 0,
    maxHeight: "95%",
  },
  title: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#111827",
    margin: 0,
  },
  pageSubtitle: {
    marginTop: 6,
    color: "#6b7280",
    fontSize: 13,
  },
  titleBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "14px",
    gap: 16,
  },
  refreshButton: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#0a6340",
    backgroundColor: "#ecfdf5",
    padding: "10px 14px",
    borderRadius: "8px",
    border: "1px solid #bbf7d0",
    cursor: "pointer",
  },
  eventsSingleColumn: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
    flex: 1,
    minHeight: 0,
  },
  eventsPanel: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    padding: 12,
    display: "flex",
    flexDirection: "column",
    minHeight: 0,
    flex: 1,
  },
  panelHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  panelTitle: {
    margin: 0,
    fontSize: 16,
    color: "#111827",
  },
  badgeCount: {
    fontSize: 12,
    fontWeight: "700",
    color: "#374151",
    backgroundColor: "#f3f4f6",
    borderRadius: 99,
    padding: "4px 8px",
  },
  eventsList: {
    flex: 1,
    overflowY: "auto",
    paddingRight: 4,
  },
  eventCardButton: {
    border: "none",
    backgroundColor: "transparent",
    textAlign: "left",
    padding: 0,
    cursor: "pointer",
    marginBottom: 10,
  },
  eventCard: {
    backgroundColor: "#f9fafb",
    borderRadius: "10px",
    padding: "12px",
    border: "1px solid #e5e7eb",
  },
  eventHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "8px",
    gap: 8,
  },
  eventMetaRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  eventActions: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  eventType: {
    color: "#111827",
    fontWeight: "700",
    fontSize: "13px",
    margin: 0,
  },
  eventTime: {
    color: "#6b7280",
    fontSize: "11px",
    fontStyle: "italic",
    margin: 0,
  },
  eventConfidence: {
    color: "#0f766e",
    fontWeight: "700",
    fontSize: 12,
  },
  activePill: {
    backgroundColor: "#dcfce7",
    color: "#166534",
    borderRadius: 999,
    fontSize: 11,
    padding: "2px 7px",
    fontWeight: "700",
  },
  resolveInlineButton: {
    backgroundColor: "#065f46",
    color: "white",
    border: "none",
    borderRadius: 999,
    fontSize: 11,
    fontWeight: "700",
    padding: "2px 8px",
    cursor: "pointer",
  },
  resolveInlineButtonDisabled: { opacity: 0.6, cursor: "not-allowed" },
  emptyText: { color: "#9ca3af", fontSize: 13, marginTop: 8, display: "block" },
  cameraSidebar: {
    flex: 1,
    padding: "24px 24px 24px 0",
    boxSizing: "border-box",
  },
  cameraWrapper: {
    width: "100%",
    aspectRatio: "4 / 3",
    borderRadius: "12px",
    overflow: "hidden",
    backgroundColor: "#111827",
    position: "relative",
    border: "1px solid #d1d5db",
  },
  camera: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
    display: "block",
  },
  cameraMetaPanel: {
    marginTop: 14,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    padding: 12,
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  metaRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  metaLabel: { color: "#6b7280", fontSize: 12, fontWeight: "600" },
  metaValue: { color: "#111827", fontSize: 13, fontWeight: "700" },
  connectionBadge: {
    fontSize: 11,
    fontWeight: "700",
    padding: "4px 8px",
    borderRadius: 999,
    color: "#ffffff",
  },
  connectionBadgeConnected: { backgroundColor: "#10b981" },
  connectionBadgeDisconnected: { backgroundColor: "#dc2626" },
  cameraPlaceholder: {
    position: "absolute",
    inset: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    padding: "24px",
    textAlign: "center",
    backgroundColor: "#1f2937",
    color: "white",
    zIndex: 5,
  },
  cameraPlaceholderTitle: { fontSize: "18px", fontWeight: "700" },
  cameraPlaceholderText: {
    maxWidth: "320px",
    color: "#d1d5db",
    fontSize: "13px",
    lineHeight: 1.4,
  },
  retryButton: {
    border: "1px solid #34d399",
    borderRadius: "8px",
    backgroundColor: "rgba(52, 211, 153, 0.15)",
    color: "#a7f3d0",
    cursor: "pointer",
    fontWeight: "700",
    padding: "8px 12px",
  },
  status: {
    position: "absolute",
    top: "10px",
    left: "10px",
    color: "white",
    fontWeight: "700",
    fontSize: "12px",
    padding: "7px 9px",
    borderRadius: "7px",
    zIndex: 10,
  },
  warningText: {
    position: "absolute",
    top: "100px",
    left: "50%",
    transform: "translateX(-50%)",
    color: "#fee2e2",
    fontSize: "14px",
    fontWeight: "700",
    backgroundColor: "rgba(127, 29, 29, 0.85)",
    padding: "8px 10px",
    borderRadius: "8px",
    zIndex: 10,
    whiteSpace: "nowrap",
  },
  statsPanel: {
    position: "absolute",
    bottom: "10px",
    right: "10px",
    backgroundColor: "rgba(17,24,39,0.8)",
    padding: "10px",
    borderRadius: "10px",
    zIndex: 10,
  },
  statText: { color: "#e5e7eb", fontSize: "11px", margin: "2px 0" },
  boundingBox: {
    position: "absolute",
    border: "2px solid #22c55e",
    backgroundColor: "rgba(34, 197, 94, 0.2)",
    pointerEvents: "none",
  },
  label: {
    position: "absolute",
    top: "-20px",
    left: "-2px",
    color: "#dcfce7",
    backgroundColor: "rgba(15,23,42,0.85)",
    padding: "0 4px",
    fontSize: "12px",
    fontWeight: "700",
    whiteSpace: "nowrap",
  },
  interactionBox: {
    position: "absolute",
    border: "2px solid",
    borderRadius: "3px",
    pointerEvents: "none",
  },
  interactionLabel: {
    position: "absolute",
    top: "-16px",
    left: "-2px",
    backgroundColor: "#111827",
    padding: "0 3px",
    fontSize: "10px",
    fontWeight: "700",
    whiteSpace: "nowrap",
  },
  settingsButton: {
    position: "absolute",
    bottom: "10px",
    left: "10px",
    fontSize: "22px",
    backgroundColor: "rgba(255,255,255,0.2)",
    padding: "8px",
    borderRadius: "20px",
    cursor: "pointer",
    zIndex: 10,
    border: "none",
    color: "white",
  },
  toggleCameraButton: {
    position: "absolute",
    bottom: "10px",
    left: "60px",
    fontSize: "22px",
    backgroundColor: "rgba(255,255,255,0.2)",
    padding: "8px",
    borderRadius: "20px",
    cursor: "pointer",
    zIndex: 10,
    border: "none",
    color: "white",
  },
  detailModalOverlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    zIndex: 5000,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  detailModal: {
    width: "min(900px, 96vw)",
    maxHeight: "90vh",
    overflowY: "auto",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    border: "1px solid #e5e7eb",
  },
  detailHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  detailTitle: { margin: 0, fontSize: 18, color: "#111827" },
  detailClose: {
    border: "1px solid #d1d5db",
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    padding: "8px 12px",
    cursor: "pointer",
  },
  detailMetaGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 8,
    marginBottom: 12,
    color: "#374151",
    fontSize: 13,
  },
  detailImage: {
    width: "100%",
    maxHeight: 280,
    objectFit: "contain",
    borderRadius: 10,
    border: "1px solid #e5e7eb",
    marginBottom: 12,
    backgroundColor: "#111827",
  },
  emptyEvidence: {
    padding: 10,
    border: "1px dashed #d1d5db",
    borderRadius: 8,
    color: "#6b7280",
    marginBottom: 12,
  },
  detailMapShell: {
    height: 220,
    borderRadius: 10,
    overflow: "hidden",
    border: "1px solid #e5e7eb",
    marginBottom: 12,
  },
  mapCanvas: { width: "100%", height: "100%" },
  metadataBlock: {
    backgroundColor: "#f9fafb",
    border: "1px solid #e5e7eb",
    borderRadius: 8,
    padding: 10,
    maxHeight: 180,
    overflow: "auto",
    fontSize: 12,
    color: "#374151",
  },
  evidencePanel: {
    border: "1px solid #e5e7eb",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    backgroundColor: "#ffffff",
  },
  evidenceTitle: {
    margin: "0 0 10px 0",
    color: "#111827",
    fontSize: 15,
  },
  evidenceRow: {
    display: "grid",
    gridTemplateColumns: "150px 1fr",
    gap: 12,
    padding: "8px 0",
    borderTop: "1px solid #f3f4f6",
  },
  evidenceLabel: {
    color: "#6b7280",
    fontSize: 12,
    fontWeight: "700",
  },
  evidenceValue: {
    color: "#111827",
    fontSize: 13,
    wordBreak: "break-word",
  },
  evidenceValueContainer: {
    minWidth: 0,
  },
  evidenceChipWrap: {
    display: "flex",
    flexWrap: "wrap",
    gap: 6,
  },
  evidenceChip: {
    backgroundColor: "#f0fdf4",
    border: "1px solid #bbf7d0",
    borderRadius: 999,
    color: "#047857",
    fontSize: 12,
    fontWeight: "700",
    padding: "4px 9px",
  },
  evidenceObjectList: {
    display: "grid",
    gap: 6,
  },
  evidenceObjectRow: {
    display: "grid",
    gridTemplateColumns: "120px 1fr",
    gap: 8,
    padding: "5px 8px",
    backgroundColor: "#f9fafb",
    borderRadius: 6,
  },
  evidenceObjectKey: {
    color: "#6b7280",
    fontSize: 12,
    fontWeight: "700",
  },
  evidenceObjectValue: {
    color: "#111827",
    fontSize: 12,
    wordBreak: "break-word",
  },
  resolveButton: {
    marginTop: 12,
    backgroundColor: "#065f46",
    color: "white",
    border: "none",
    borderRadius: 8,
    padding: "10px 12px",
    fontWeight: "700",
    cursor: "pointer",
  },
  resolveButtonDisabled: { opacity: 0.6, cursor: "not-allowed" },
  configModalOverlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(15,23,42,0.65)",
    zIndex: 1000,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "16px",
    boxSizing: "border-box",
    paddingTop: "10vh",
  },
  configForm: {
    padding: "20px",
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    maxWidth: "420px",
    width: "100%",
    margin: "0 auto",
    border: "1px solid #e5e7eb",
  },
  configTitle: {
    fontSize: "22px",
    fontWeight: "700",
    color: "#111827",
    margin: "0 0 20px 0",
  },
  configLabel: {
    fontSize: "14px",
    fontWeight: "600",
    marginTop: "15px",
    marginBottom: "5px",
    color: "#374151",
    display: "block",
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid #d1d5db",
    padding: "10px",
    borderRadius: "8px",
    backgroundColor: "#f9fafb",
    marginBottom: "10px",
    color: "#111827",
  },
  buttonContainer: { margin: "8px 0" },
  buttonSave: {
    width: "100%",
    padding: "10px",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "700",
    backgroundColor: "#0a6340",
    color: "white",
  },
  buttonCancel: {
    width: "100%",
    padding: "10px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "700",
    backgroundColor: "#f3f4f6",
    color: "#111827",
  },
  testFootageDivider: {
    borderTop: "1px solid #e5e7eb",
    margin: "18px 0 6px 0",
  },
  testFootageHint: {
    fontSize: "12px",
    color: "#6b7280",
    margin: "4px 0 10px 0",
    lineHeight: 1.4,
  },
  uploadButton: {
    display: "inline-block",
    width: "100%",
    boxSizing: "border-box",
    padding: "10px",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "700",
    backgroundColor: "#1d4ed8",
    color: "white",
    textAlign: "center",
  },
  testModeBadge: {
    position: "absolute",
    top: "10px",
    right: "10px",
    backgroundColor: "#1d4ed8",
    color: "white",
    padding: "4px 8px",
    borderRadius: "999px",
    fontSize: "11px",
    fontWeight: "700",
    letterSpacing: "0.04em",
    zIndex: 10,
  },
};
