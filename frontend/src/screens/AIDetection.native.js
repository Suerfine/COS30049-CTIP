import React, { useRef, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Button,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  Image,
  useWindowDimensions,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
// expo-video is used for test footage playback (expo-av v14+ removed the Video component)
let TestVideoPlayer = null;
try {
  const { VideoView, useVideoPlayer } = require("expo-video");
  TestVideoPlayer = ({ uri, style, onPlayerReady, onTimeUpdate }) => {
    const player = useVideoPlayer(uri, (p) => {
      p.loop = true;
      p.timeUpdateEventInterval = 0.2;
      p.play();
    });
    useEffect(() => {
      onPlayerReady?.(player);
      let sub;
      try {
        sub = player.addListener("timeUpdate", (event) => {
          const t = typeof event === "number" ? event : event?.currentTime;
          if (typeof t === "number") onTimeUpdate?.(t);
        });
      } catch (_) {}
      return () => {
        onPlayerReady?.(null);
        try { sub?.remove(); } catch (_) {}
      };
    }, [player]);
    return <VideoView player={player} style={style} contentFit="contain" />;
  };
} catch (_) {}

let VideoThumbnails = null;
try { VideoThumbnails = require("expo-video-thumbnails"); } catch (_) {}

import apiClient from "../config/apiConfig";
import { userDashboardService } from "../services/userDashboardService";
import { Camera as CameraIcon } from "lucide-react-native";

const SERVER_CONFIG_STORAGE_KEY = "aiDetectionServerConfig";

const getAutoHost = () => {
  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.manifest2?.extra?.expoClient?.hostUri ||
    Constants.manifest?.debuggerHost;
  if (hostUri) return hostUri.split(":")[0];
  return "localhost";
};

const boxOverlapRatio = (boxA, boxB) => {
  const [ax1, ay1, ax2, ay2] = boxA;
  const [bx1, by1, bx2, by2] = boxB;
  const ix1 = Math.max(ax1, bx1), iy1 = Math.max(ay1, by1);
  const ix2 = Math.min(ax2, bx2), iy2 = Math.min(ay2, by2);
  if (ix2 <= ix1 || iy2 <= iy1) return 0;
  const intersection = (ix2 - ix1) * (iy2 - iy1);
  const areaA = (ax2 - ax1) * (ay2 - ay1);
  return areaA > 0 ? intersection / areaA : 0;
};

const NON_ANOMALY_EVENT_TYPES = new Set(["touch_plant", "touch_animal"]);
const isNonAnomalyEvent = (eventType) => NON_ANOMALY_EVENT_TYPES.has(eventType);

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

const EVENT_LABELS = {
  touch_plant: "Touch Plant",
  touch_animal: "Touch Animal",
  plucking_plant: "Plucking Plant",
  animal_strike: "Animal Strike",
  extended_touch_animal: "Extended Touch Animal",
  extended_touch_plant: "Extended Touch Plant",
};

export default function DetectionScreen() {
  const { width } = useWindowDimensions();
  const isCompact = width < 720;
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);
  const isCapturing = useRef(false);
  const lastLogTime = useRef(0);
  const lastFrameBase64 = useRef(null);
  const lastPhotoDimensions = useRef({ width: 640, height: 480 });
  const wsRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const videoPlayerRef = useRef(null);
  const videoCurrentTimeRef = useRef(0);
  const captureStartedAtRef = useRef(0);
  const lastSendAtRef = useRef(0);

  const [serverConfig, setServerConfig] = useState({
    host: getAutoHost(),
    port: "8000",
    inferenceResolution: 640,
  });
  const [tempConfig, setTempConfig] = useState({
    host: getAutoHost(),
    port: "8000",
    inferenceResolution: 640,
  });
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
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [testVideoUri, setTestVideoUri] = useState(null);
  const isTestMode = !!testVideoUri;
  const [testModeStatus, setTestModeStatus] = useState(null);
  const testStartedAtRef = useRef(0);

  // Cover-mode coordinate mapping: CameraView scales the photo uniformly to fill the
  // container (like CSS object-fit: cover), so one dimension fills exactly and the
  // other is cropped. We must use a single uniform scale + a crop offset.
  const photoW = lastPhotoDimensions.current.width;
  const photoH = lastPhotoDimensions.current.height;
  let COVER_SCALE = 1,
    OFFSET_X = 0,
    OFFSET_Y = 0;
  if (cameraLayout) {
    const scaleW = cameraLayout.width / photoW;
    const scaleH = cameraLayout.height / photoH;
    COVER_SCALE = Math.max(scaleW, scaleH);
    OFFSET_X = (photoW * COVER_SCALE - cameraLayout.width) / 2;
    OFFSET_Y = (photoH * COVER_SCALE - cameraLayout.height) / 2;
  }
  const toRenderX = (px) => px * COVER_SCALE - OFFSET_X;
  const toRenderY = (py) => py * COVER_SCALE - OFFSET_Y;

  const filteredCompliance = useMemo(() => {
    const compliance = latestResult?.compliance;
    if (!compliance) return compliance;
    const humanBoxes = latestResult?.human_boxes || [];
    const detections = latestResult?.detections || [];
    const hasVisibleAnimal = detections.some(
      (det) => det.class === 1 && !humanBoxes.some((human) => boxOverlapRatio(det.bbox, human.bbox) >= 0.8)
    );
    if (hasVisibleAnimal) return compliance;
    return { ...compliance, touch_animal: false, animal_strike: false, extended_touch_animal: false };
  }, [latestResult]);

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

  const getEventLabel = (eventType) => {
    if (!eventType) return "Unknown";
    if (EVENT_LABELS[eventType]) return EVENT_LABELS[eventType];
    return eventType
      .split("_")
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const getEventConfidence = (event) => {
    const raw =
      event?.metadata?.detection_confidence ?? event?.metadata?.confidence;
    const confidence = Number(raw);
    if (!Number.isFinite(confidence)) return "N/A";
    return `${Math.round(confidence * 100)}%`;
  };

  // Load persisted config on mount
  useEffect(() => {
    AsyncStorage.getItem(SERVER_CONFIG_STORAGE_KEY).then((saved) => {
      if (!saved) return;
      try {
        const parsed = JSON.parse(saved);
        const loaded = {
          host: parsed?.host || getAutoHost(),
          port: parsed?.port || "8000",
          inferenceResolution: Number(parsed?.inferenceResolution) || 640,
        };
        setServerConfig(loaded);
        setTempConfig(loaded);
      } catch {
        // Ignore corrupt storage
      }
    });
  }, []);

  // Persist config whenever it changes
  useEffect(() => {
    AsyncStorage.setItem(
      SERVER_CONFIG_STORAGE_KEY,
      JSON.stringify(serverConfig),
    ).catch(() => {});
    setTempConfig(serverConfig);
  }, [serverConfig]);

  // 1. Fetch Current User
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

  // 2. Fetch Anomaly Events (active only, non-anomaly types excluded)
  const fetchAnomalyEvents = async () => {
    if (!currentUser) return;
    setEventsLoading(true);
    try {
      const response = await apiClient.get(`/anomaly-events/${currentUser.id}`, {
        params: { includeResolved: false, page: 1, size: 100, orderBy: "created_at desc" },
      });
      const events = extractEvents(response.data).filter(
        (event) => !isResolvedEvent(event) && !isNonAnomalyEvent(event?.event_type)
      );
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

  // 3. WebSocket Connection
  useEffect(() => {
    const connect = () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }

      if (wsRef.current) {
        wsRef.current.onopen = null;
        wsRef.current.onmessage = null;
        wsRef.current.onerror = null;
        wsRef.current.onclose = null;
        wsRef.current.close();
      }

      const ws = new WebSocket(`ws://${serverConfig.host}:${serverConfig.port}/ws/detect`);
      wsRef.current = ws;

      ws.onopen = () => setIsConnected(true);

      ws.onmessage = (event) => {
        try {
          const result = JSON.parse(event.data);
          if (result && !result.error) setLatestResult(result);
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

  // 4. Camera / Test-Video Capture Interval — sends frames over the open WebSocket.
  useEffect(() => {
    const captureInterval = setInterval(async () => {
      const now = Date.now();
      const wsOpen = wsRef.current?.readyState === WebSocket.OPEN;

      // Watchdog: reset isCapturing if a previous send never got a reply within 3s
      if (isCapturing.current && now - captureStartedAtRef.current > 3000) {
        isCapturing.current = false;
      }

      // Keepalive: if WS would otherwise sit idle, send a tiny ping so NAT/router
      // doesn't drop the TCP connection. Server replies with a decode error which
      // resets isCapturing via onmessage.
      if (wsOpen && !isCapturing.current && now - lastSendAtRef.current > 8000) {
        try {
          isCapturing.current = true;
          captureStartedAtRef.current = now;
          wsRef.current.send(JSON.stringify({ keepalive: true }));
          lastSendAtRef.current = now;
        } catch {
          isCapturing.current = false;
        }
        return;
      }

      if (!cameraEnabled && !isTestMode) return;
      if (isCapturing.current) return;
      if (!wsOpen) {
        if (isTestMode) setTestModeStatus("Waiting for AI server connection…");
        return;
      }

      isCapturing.current = true;
      captureStartedAtRef.current = now;

      if (isTestMode) {
        // Extract a frame from the test video at the current playback position.
        if (!VideoThumbnails?.getThumbnailAsync) {
          setTestModeStatus("expo-video-thumbnails not loaded — rebuild native app");
          isCapturing.current = false;
          return;
        }
        if (!testVideoUri) {
          isCapturing.current = false;
          return;
        }
        let thumbUri = null;
        try {
          const eventTime = videoCurrentTimeRef.current || 0;
          const playerTime = videoPlayerRef.current?.currentTime || 0;
          const elapsedSec = testStartedAtRef.current
            ? (Date.now() - testStartedAtRef.current) / 1000
            : 0;
          const currentTimeSec = eventTime || playerTime || elapsedSec;
          const thumb = await VideoThumbnails.getThumbnailAsync(testVideoUri, {
            time: Math.max(0, Math.floor(currentTimeSec * 1000)),
            quality: 0.5,
          });
          thumbUri = thumb.uri;
          lastPhotoDimensions.current = { width: thumb.width, height: thumb.height };
          const base64 = await FileSystem.readAsStringAsync(thumbUri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          lastFrameBase64.current = base64;
          wsRef.current.send(JSON.stringify({
            image_base64: base64,
            user_id: currentUser?.id || 1,
            imgsz: serverConfig.inferenceResolution || 640,
          }));
          lastSendAtRef.current = Date.now();
          setTestModeStatus(`t=${currentTimeSec.toFixed(1)}s ${thumb.width}x${thumb.height}`);
        } catch (err) {
          setTestModeStatus(`Thumb error: ${err?.message || String(err)}`);
          isCapturing.current = false;
        } finally {
          if (thumbUri) FileSystem.deleteAsync(thumbUri, { idempotent: true }).catch(() => {});
        }
        return;
      }

      // Live camera capture
      if (!cameraRef.current) { isCapturing.current = false; return; }
      let photoUri = null;
      try {
        const photo = await cameraRef.current.takePictureAsync({
          base64: true,
          quality: 0.3,
          skipProcessing: true,
        });
        photoUri = photo.uri;
        lastPhotoDimensions.current = { width: photo.width, height: photo.height };
        lastFrameBase64.current = photo.base64;
        wsRef.current.send(JSON.stringify({
          image_base64: photo.base64,
          user_id: currentUser?.id || 1,
          imgsz: serverConfig.inferenceResolution || 640,
        }));
        lastSendAtRef.current = Date.now();
      } catch {
        isCapturing.current = false;
      } finally {
        if (photoUri) FileSystem.deleteAsync(photoUri, { idempotent: true }).catch(() => {});
      }
    }, 250);

    return () => clearInterval(captureInterval);
  }, [currentUser, cameraEnabled, isTestMode, testVideoUri]);

  // 5. Client-Side Anomaly Logging
  useEffect(() => {
    if (filteredCompliance && currentUser) {
      const { plucking_plant, animal_strike, extended_touch_animal, extended_touch_plant, touch_animal, touch_plant } = filteredCompliance;
      let detectedEventType = null;

      if (plucking_plant) detectedEventType = "plucking_plant";
      else if (animal_strike) detectedEventType = "animal_strike";
      else if (extended_touch_animal) detectedEventType = "extended_touch_animal";
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
          const maxConfidence = confidenceCandidates.length ? Math.max(...confidenceCandidates) : null;

          const payload = {
            user_id: currentUser.id,
            event_type: detectedEventType,
            latitude: 1.5533,
            longitude: 110.3592,
            metadata: {
              source: "mobile_ai_detection",
              timestamp: new Date().toISOString(),
              detection_confidence: maxConfidence,
              detections: latestResult?.detections?.length || 0,
              poses: latestResult?.poses?.length || 0,
              inference_ms: latestResult?.inference_ms || 0,
            },
            annotated_frame_base64: lastFrameBase64.current,
          };

          apiClient
            .post("/anomaly-events", payload)
            .then(() => { fetchAnomalyEvents(); })
            .catch((err) => {
              const errorMsg = err.response?.data?.message || err.response?.data?.error || err.message;
              Alert.alert("Database Error", `Backend rejected the anomaly log:\n${errorMsg}`);
            });
        }
      }
    }
  }, [filteredCompliance]);

  const toggleCamera = () => {
    if (isTestMode) return;
    setCameraEnabled((prev) => !prev);
  };

  const handlePickTestVideo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["videos"],
      allowsEditing: false,
      quality: 1,
    });
    if (result.canceled || !result.assets?.[0]?.uri) return;
    testStartedAtRef.current = Date.now();
    videoCurrentTimeRef.current = 0;
    setTestModeStatus("Starting…");
    setTestVideoUri(result.assets[0].uri);
    setCameraEnabled(false);
    setConfigMode(false);
  };

  const stopTestVideo = () => {
    setTestVideoUri(null);
    setCameraEnabled(true);
    setTestModeStatus(null);
    testStartedAtRef.current = 0;
    videoCurrentTimeRef.current = 0;
  };

  // Resolve Event
  const resolveEvent = async (eventId) => {
    setResolvingEventId(eventId);
    try {
      try {
        await apiClient.post(`/anomaly-events/${eventId}/resolve`);
      } catch (firstError) {
        await apiClient.post(`/Anomaly-events/${eventId}/resolve`);
      }
      setAnomalyEvents((prev) => prev.filter((event) => event.id !== eventId));
      setSelectedEvent(null);
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to resolve anomaly event.";
      Alert.alert("Error", message);
    } finally {
      setResolvingEventId(null);
    }
  };

  // --- RENDER HELPERS ---
  const renderSkeletonLine = (kp1, kp2, index) => {
    if (!kp1 || !kp2 || kp1.confidence < 0.3 || kp2.confidence < 0.3)
      return null;
    const x1 = toRenderX(kp1.x),
      y1 = toRenderY(kp1.y);
    const x2 = toRenderX(kp2.x),
      y2 = toRenderY(kp2.y);
    const dx = x2 - x1,
      dy = y2 - y1;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    const cx = (x1 + x2) / 2,
      cy = (y1 + y2) / 2;

    return (
      <View
        key={`line-${index}`}
        style={{
          position: "absolute",
          left: cx - distance / 2,
          top: cy - 1,
          width: distance,
          height: 2,
          backgroundColor: "#00FF00",
          transform: [{ rotate: `${angle}deg` }],
          opacity: 0.7,
        }}
      />
    );
  };

  const renderKeypoint = (kp, index) => {
    if (!kp || kp.confidence < 0.3) return null;
    const x = toRenderX(kp.x),
      y = toRenderY(kp.y);
    const KP_RADIUS = 5;

    return (
      <View
        key={`kp-${index}`}
        style={{
          position: "absolute",
          left: x - KP_RADIUS,
          top: y - KP_RADIUS,
          width: KP_RADIUS * 2,
          height: KP_RADIUS * 2,
          borderRadius: KP_RADIUS,
          backgroundColor: "#00FFFF",
          borderWidth: 1,
          borderColor: "#FFFFFF",
          opacity: 0.8,
        }}
      />
    );
  };

  // --- CONFIG UI ---
  if (configMode) {
    return (
      <View style={styles.configContainer}>
        <ScrollView style={styles.configFormScroll}>
          <Text style={styles.configTitle}>AI Server Configuration</Text>
          <Text style={styles.configLabel}>Server Host (IP Address)</Text>
          <TextInput
            style={styles.input}
            placeholder={getAutoHost()}
            value={tempConfig.host}
            onChangeText={(t) => setTempConfig({ ...tempConfig, host: t })}
          />
          <Text style={styles.configLabel}>Server Port</Text>
          <TextInput
            style={styles.input}
            placeholder="8000"
            value={tempConfig.port}
            onChangeText={(t) => setTempConfig({ ...tempConfig, port: t })}
            keyboardType="numeric"
          />
          <Text style={styles.configLabel}>Inference Resolution</Text>
          {[320, 416, 480, 640, 800].map((res) => (
            <TouchableOpacity
              key={res}
              onPress={() => setTempConfig({ ...tempConfig, inferenceResolution: res })}
              style={[styles.resolutionOption, tempConfig.inferenceResolution === res && styles.resolutionOptionActive]}
            >
              <Text style={[styles.resolutionOptionText, tempConfig.inferenceResolution === res && styles.resolutionOptionTextActive]}>
                {res} px{res === 640 ? " (default)" : res === 320 ? " — fastest" : res === 800 ? " — slowest, highest accuracy" : ""}
              </Text>
            </TouchableOpacity>
          ))}

          <View style={styles.configDivider} />
          <Text style={styles.configLabel}>Test with pre-recorded footage</Text>
          <Text style={styles.configHint}>
            Pick a video from your library to play it in the viewfinder. Note: AI frame capture is paused in test mode.
          </Text>
          {isTestMode ? (
            <View style={styles.buttonContainer}>
              <Button
                title="Stop test footage & resume camera"
                onPress={() => { stopTestVideo(); setConfigMode(false); }}
                color="#dc2626"
              />
            </View>
          ) : (
            <View style={styles.buttonContainer}>
              <Button title="Upload test video" onPress={handlePickTestVideo} color="#1d4ed8" />
            </View>
          )}

          <View style={styles.buttonContainer}>
            <Button
              title="Save"
              onPress={() => {
                setServerConfig({
                  host: (tempConfig.host || "").trim() || getAutoHost(),
                  port: (tempConfig.port || "").trim() || "8000",
                  inferenceResolution: Number(tempConfig.inferenceResolution) || 640,
                });
                setConfigMode(false);
              }}
              color="#4CAF50"
            />
          </View>
          <View style={styles.buttonContainer}>
            <Button
              title="Cancel"
              onPress={() => {
                setTempConfig(serverConfig);
                setConfigMode(false);
              }}
              color="#999"
            />
          </View>
        </ScrollView>
      </View>
    );
  }

  // --- MAIN UI ---
  if (!permission?.granted) {
    return (
      <View style={styles.permissionContainer}>
        <View style={styles.permissionCard}>
          <View style={styles.iconCircle}>
            <Text style={styles.cameraIcon}>
              <CameraIcon color="grey" />
            </Text>
          </View>

          <Text style={styles.permissionTitle}>Camera Access Required</Text>

          <Text style={styles.permissionDescription}>
            To perform real-time AI compliance monitoring and keep our park
            safe, the application requires permission to access your device's
            camera stream.
          </Text>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={requestPermission}
            activeOpacity={0.8}
          >
            <Text style={styles.actionBtnText}>Grant Camera Permission</Text>
          </TouchableOpacity>

          <Text style={styles.permissionNotice}>
            Your privacy is guarded. The video stream is processed completely
            locally for on-site edge model inference.
          </Text>
        </View>
      </View>
    );
  }
  if (userLoading)
    return (
      <View style={styles.loadingView}>
        <Text style={{ color: "#888" }}>Loading user...</Text>
      </View>
    );

  return (
    <View
      style={[styles.appContainer, isCompact && styles.appContainerCompact]}
    >
      {/* Event Detail Modal */}
      <Modal
        visible={!!selectedEvent}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedEvent(null)}
      >
        <View style={styles.detailModalOverlay}>
          <View style={styles.detailModal}>
            <ScrollView>
              <View style={styles.detailHeader}>
                <Text style={styles.detailTitle}>
                  {selectedEvent ? getEventLabel(selectedEvent.event_type) : ""}
                </Text>
                <TouchableOpacity onPress={() => setSelectedEvent(null)}>
                  <Text style={styles.detailClose}>Close</Text>
                </TouchableOpacity>
              </View>
              {selectedEvent && (
                <>
                  <View style={styles.detailMetaGrid}>
                    <Text style={styles.detailMetaText}>
                      <Text style={styles.detailMetaLabel}>Detected: </Text>
                      {new Date(selectedEvent.created_at).toLocaleString()}
                    </Text>
                    <Text style={styles.detailMetaText}>
                      <Text style={styles.detailMetaLabel}>Confidence: </Text>
                      {getEventConfidence(selectedEvent)}
                    </Text>
                    <Text style={styles.detailMetaText}>
                      <Text style={styles.detailMetaLabel}>Latitude: </Text>
                      {selectedEvent.latitude ?? "N/A"}
                    </Text>
                    <Text style={styles.detailMetaText}>
                      <Text style={styles.detailMetaLabel}>Longitude: </Text>
                      {selectedEvent.longitude ?? "N/A"}
                    </Text>
                  </View>
                  {selectedEvent.annotated_frame_base64 ? (
                    <Image
                      source={{
                        uri: `data:image/jpeg;base64,${selectedEvent.annotated_frame_base64}`,
                      }}
                      style={styles.detailImage}
                      resizeMode="contain"
                    />
                  ) : (
                    <View style={styles.emptyEvidence}>
                      <Text style={styles.emptyEvidenceText}>
                        No annotated frame recorded for this event.
                      </Text>
                    </View>
                  )}
                  <ScrollView horizontal style={styles.metadataBlock}>
                    <Text style={styles.metadataText}>
                      {JSON.stringify(selectedEvent.metadata || {}, null, 2)}
                    </Text>
                  </ScrollView>
                  {!selectedEvent.is_resolved && (
                    <TouchableOpacity
                      style={[
                        styles.resolveButton,
                        resolvingEventId === selectedEvent.id &&
                          styles.resolveButtonDisabled,
                      ]}
                      onPress={() => resolveEvent(selectedEvent.id)}
                      disabled={resolvingEventId === selectedEvent.id}
                    >
                      <Text style={styles.resolveButtonText}>
                        {resolvingEventId === selectedEvent.id
                          ? "Resolving..."
                          : "Mark as Resolved"}
                      </Text>
                    </TouchableOpacity>
                  )}
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* LEFT PANEL: Anomaly Event Log */}
      <View
        style={[styles.mainContent, isCompact && styles.mainContentCompact]}
      >
        <View style={styles.titleBar}>
          <View style={styles.titleCopy}>
            <Text style={styles.title}>Anomaly Detection</Text>
            <Text style={styles.pageSubtitle}>
              Monitor and review active anomaly alerts
            </Text>
          </View>
          <TouchableOpacity
            style={styles.refreshButtonContainer}
            onPress={fetchAnomalyEvents}
          >
            <Text style={styles.refreshButton}>Refresh</Text>
          </TouchableOpacity>
        </View>

        {eventsLoading ? (
          <Text style={{ color: "#888", marginTop: 20 }}>
            Loading events...
          </Text>
        ) : (
          <View style={styles.eventsPanel}>
            <View style={styles.panelHeader}>
              <Text style={styles.panelTitle}>Active Anomalies</Text>
              <View style={styles.badgeCount}>
                <Text style={styles.badgeCountText}>
                  {anomalyEvents.length}
                </Text>
              </View>
            </View>
            {anomalyEvents.length === 0 ? (
              <Text style={styles.emptyText}>No active anomalies</Text>
            ) : (
              <ScrollView style={styles.eventsList}>
                {anomalyEvents.map((event) => (
                  <TouchableOpacity
                    key={event.id}
                    onPress={() => setSelectedEvent(event)}
                  >
                    <View style={styles.eventCard}>
                      <View style={styles.eventHeader}>
                        <Text style={styles.eventType}>
                          {getEventLabel(event.event_type)}
                        </Text>
                        <Text style={styles.eventConfidence}>
                          {getEventConfidence(event)}
                        </Text>
                      </View>
                      <View style={styles.eventMetaRow}>
                        <Text style={styles.eventTime}>
                          {new Date(event.created_at).toLocaleString()}
                        </Text>
                        <View style={styles.eventActions}>
                          <View style={styles.activePill}>
                            <Text style={styles.activePillText}>Active</Text>
                          </View>
                          <TouchableOpacity
                            style={[styles.resolveInlineBtn, resolvingEventId === event.id && styles.resolveInlineBtnDisabled]}
                            disabled={resolvingEventId === event.id}
                            onPress={(e) => {
                              e.stopPropagation?.();
                              resolveEvent(event.id);
                            }}
                          >
                            <Text style={styles.resolveInlineBtnText}>
                              {resolvingEventId === event.id ? "Resolving..." : "Resolve"}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        )}
      </View>

      {/* RIGHT PANEL: Camera */}
      <View
        style={[styles.cameraSidebar, isCompact && styles.cameraSidebarCompact]}
      >
        <View
          style={[
            styles.cameraWrapper,
            isCompact && styles.cameraWrapperCompact,
          ]}
          onLayout={(event) =>
            setCameraLayout({
              width: event.nativeEvent.layout.width,
              height: event.nativeEvent.layout.height,
            })
          }
        >
          {isTestMode ? (
            TestVideoPlayer ? (
              <TestVideoPlayer
                uri={testVideoUri}
                style={StyleSheet.absoluteFillObject}
                onPlayerReady={(player) => { videoPlayerRef.current = player; }}
                onTimeUpdate={(t) => { videoCurrentTimeRef.current = t; }}
              />
            ) : (
              <View style={styles.cameraOff}>
                <Text style={styles.cameraOffTitle}>Test Video Selected</Text>
                <Text style={styles.cameraOffText}>
                  Install expo-video for in-app playback:{"\n"}npx expo install expo-video
                </Text>
                <Text style={[styles.cameraOffText, { marginTop: 8, color: "#facc15" }]}>
                  AI capture paused
                </Text>
              </View>
            )
          ) : cameraEnabled ? (
            <CameraView ref={cameraRef} style={styles.camera} facing="back" />
          ) : (
            <View style={styles.cameraOff}>
              <Text style={styles.cameraOffTitle}>Camera Off</Text>
              <Text style={styles.cameraOffText}>Tap the button below to turn it back on</Text>
            </View>
          )}

          <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
            <Text
              style={[
                styles.status,
                {
                  backgroundColor: isConnected
                    ? "rgba(16, 185, 129, 0.85)"
                    : "rgba(220, 38, 38, 0.85)",
                },
              ]}
            >
              {isConnected ? "Connected (AI API)" : "AI Server Disconnected"}
            </Text>

            {/* Detections Overlay */}
            {isConnected &&
              cameraLayout &&
              latestResult?.detections?.map((det, index) => {
                const [x1, y1, x2, y2] = det.bbox;
                return (
                  <View
                    key={`det-${index}`}
                    style={[
                      styles.boundingBox,
                      {
                        left: toRenderX(x1),
                        top: toRenderY(y1),
                        width: (x2 - x1) * COVER_SCALE,
                        height: (y2 - y1) * COVER_SCALE,
                      },
                    ]}
                  >
                    <Text style={styles.detectionLabel}>
                      {det.class_name} {Math.round(det.confidence * 100)}%
                    </Text>
                  </View>
                );
              })}

            {/* Pose Skeleton Overlay */}
            {isConnected &&
              cameraLayout &&
              latestResult?.poses?.map((pose, poseIndex) => (
                <View
                  key={`pose-${poseIndex}`}
                  style={{
                    position: "absolute",
                    width: "100%",
                    height: "100%",
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
                </View>
              ))}

            {/* Hand Box Overlay */}
            {isConnected &&
              cameraLayout &&
              latestResult?.compliance?.hand_boxes?.map((box, index) => {
                const isTouching =
                  latestResult.compliance.touch_plant ||
                  latestResult.compliance.touch_animal;
                return (
                  <View
                    key={`hand-${index}`}
                    style={[
                      styles.interactionBox,
                      {
                        left: toRenderX(box[0]),
                        top: toRenderY(box[1]),
                        width: (box[2] - box[0]) * COVER_SCALE,
                        height: (box[3] - box[1]) * COVER_SCALE,
                        borderColor: isTouching ? "#FF6600" : "#FFD700",
                        backgroundColor: isTouching
                          ? "rgba(255, 102, 0, 0.20)"
                          : "rgba(255, 215, 0, 0.12)",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.interactionLabel,
                        { color: isTouching ? "#FF6600" : "#FFD700" },
                      ]}
                    >
                      {isTouching ? "TOUCH" : "HAND"}
                    </Text>
                  </View>
                );
              })}

            {/* Compliance Alerts */}
            {latestResult?.compliance?.plucking_plant && (
              <Text style={styles.warningText}>WARNING: PLUCKING DETECTED</Text>
            )}
            {filteredCompliance?.animal_strike && (
              <Text style={styles.warningText}>ALERT: ANIMAL STRIKE</Text>
            )}
            {filteredCompliance?.extended_touch_animal && (
              <Text style={[styles.warningText, { backgroundColor: "rgba(255, 165, 0, 0.8)" }]}>
                EXTENDED ANIMAL TOUCH
              </Text>
            )}
            {latestResult?.compliance?.extended_touch_plant && (
              <Text style={[styles.warningText, { backgroundColor: "rgba(255, 165, 0, 0.8)" }]}>
                EXTENDED PLANT TOUCH
              </Text>
            )}

            {/* Live Stats Panel */}
            {isConnected && latestResult && (
              <View style={styles.statsPanel}>
                <Text style={styles.statText}>
                  Detections: {latestResult.detections?.length || 0}
                </Text>
                <Text style={styles.statText}>
                  Poses: {latestResult.poses?.length || 0}
                </Text>
                <Text style={styles.statText}>
                  Inference: {latestResult.inference_ms || 0}ms
                </Text>
              </View>
            )}

            {/* Test mode badge */}
            {isTestMode && (
              <View style={styles.testModeBadge}>
                <Text style={styles.testModeBadgeText}>TEST FOOTAGE — AI active</Text>
              </View>
            )}
            {isTestMode && testModeStatus ? (
              <View style={styles.testDiagnosticPanel}>
                <Text style={styles.testDiagnosticLabel}>Test capture status</Text>
                <Text style={styles.testDiagnosticText}>{testModeStatus}</Text>
              </View>
            ) : null}

            {/* Bottom controls */}
            <View style={styles.bottomControls}>
              <TouchableOpacity style={styles.overlayBtn} onPress={() => setConfigMode(true)}>
                <Text style={styles.overlayBtnText}>⚙ Config</Text>
              </TouchableOpacity>
              {!isTestMode && (
                <TouchableOpacity
                  style={[styles.overlayBtn, !cameraEnabled && styles.overlayBtnDanger]}
                  onPress={toggleCamera}
                >
                  <Text style={styles.overlayBtnText}>{cameraEnabled ? "⏸ Camera" : "⏵ Camera"}</Text>
                </TouchableOpacity>
              )}
              {isTestMode && (
                <TouchableOpacity style={[styles.overlayBtn, styles.overlayBtnDanger]} onPress={stopTestVideo}>
                  <Text style={styles.overlayBtnText}>✕ Stop Test</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  appContainer: { flex: 1, flexDirection: "row", backgroundColor: "#f6f8f7" },
  appContainerCompact: { flexDirection: "column-reverse" },
  mainContent: {
    flex: 2,
    padding: 20,
    justifyContent: "flex-start",
    alignItems: "stretch",
  },
  mainContentCompact: {
    flex: 1,
    paddingHorizontal: 14,
    paddingTop: 16,
    paddingBottom: 10,
  },
  title: { fontSize: 22, fontWeight: "bold", color: "#111827" },
  pageSubtitle: { marginTop: 4, color: "#6b7280", fontSize: 12 },
  titleCopy: { flex: 1, paddingRight: 10 },
  titleBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    gap: 10,
  },
  refreshButtonContainer: {
    flexShrink: 0,
    borderWidth: 1,
    borderColor: "#bbf7d0",
    borderRadius: 8,
    backgroundColor: "#ecfdf5",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  refreshButton: { fontSize: 13, fontWeight: "600", color: "#0a6340" },
  loadingView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f6f8f7",
  },

  eventsPanel: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 12,
  },
  panelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  panelTitle: { fontSize: 15, fontWeight: "700", color: "#111827" },
  badgeCount: {
    backgroundColor: "#f3f4f6",
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeCountText: { fontSize: 12, fontWeight: "700", color: "#374151" },
  eventsList: { flex: 1 },
  eventCard: {
    backgroundColor: "#f9fafb",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  eventHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  eventMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  eventType: {
    color: "#111827",
    fontWeight: "700",
    fontSize: 13,
    flex: 1,
    paddingRight: 8,
  },
  eventConfidence: { color: "#0f766e", fontWeight: "700", fontSize: 12 },
  eventTime: { color: "#6b7280", fontSize: 11, fontStyle: "italic", flex: 1 },
  activePill: {
    backgroundColor: "#dcfce7",
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  activePillText: { color: "#166534", fontSize: 11, fontWeight: "700" },
  eventActions: { flexDirection: "row", alignItems: "center", gap: 6 },
  resolveInlineBtn: {
    backgroundColor: "#065f46",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  resolveInlineBtnDisabled: { opacity: 0.6 },
  resolveInlineBtnText: { color: "white", fontSize: 11, fontWeight: "700" },
  emptyText: { color: "#9ca3af", fontSize: 13, marginTop: 8 },

  cameraSidebar: {
    flex: 1,
    backgroundColor: "#000000",
    justifyContent: "center",
    padding: 10,
  },
  cameraSidebarCompact: {
    flex: 0,
    height: 220,
    backgroundColor: "#f6f8f7",
    paddingHorizontal: 14,
    paddingTop: 0,
    paddingBottom: 12,
  },
  cameraWrapper: {
    width: "100%",
    aspectRatio: 4 / 3,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#1e1e1e",
  },
  cameraWrapperCompact: { height: "100%", aspectRatio: undefined },
  camera: { ...StyleSheet.absoluteFillObject },
  cameraLoading: { justifyContent: "center", alignItems: "center", backgroundColor: "#1e1e1e" },

  status: {
    position: "absolute",
    top: 10,
    left: 10,
    color: "white",
    fontWeight: "bold",
    fontSize: 12,
    padding: 6,
    borderRadius: 6,
  },
  warningText: {
    position: "absolute",
    top: 100,
    alignSelf: "center",
    color: "#fee2e2",
    fontSize: 13,
    fontWeight: "bold",
    backgroundColor: "rgba(127, 29, 29, 0.85)",
    padding: 8,
    borderRadius: 6,
  },
  statsPanel: {
    position: "absolute",
    bottom: 10,
    right: 10,
    backgroundColor: "rgba(17,24,39,0.8)",
    padding: 10,
    borderRadius: 8,
  },
  statText: { color: "#e5e7eb", fontSize: 10, marginVertical: 2 },
  boundingBox: {
    position: "absolute",
    borderWidth: 2,
    borderColor: "#22c55e",
    backgroundColor: "rgba(34, 197, 94, 0.15)",
  },
  detectionLabel: {
    position: "absolute",
    top: 2,
    left: 2,
    color: "#dcfce7",
    backgroundColor: "rgba(15,23,42,0.85)",
    paddingHorizontal: 4,
    paddingVertical: 2,
    fontSize: 11,
    fontWeight: "bold",
    borderRadius: 3,
  },
  interactionBox: { position: "absolute", borderWidth: 2, borderRadius: 3 },
  interactionLabel: {
    position: "absolute",
    top: 2,
    left: 2,
    backgroundColor: "rgba(0,0,0,0.75)",
    paddingHorizontal: 3,
    paddingVertical: 1,
    fontSize: 10,
    fontWeight: "bold",
    borderRadius: 2,
  },
  cameraOff: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#1f2937",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    padding: 24,
  },
  cameraOffTitle: { color: "white", fontSize: 16, fontWeight: "700" },
  cameraOffText: { color: "#9ca3af", fontSize: 12, textAlign: "center" },
  testModeBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "#1d4ed8",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  testModeBadgeText: { color: "white", fontSize: 11, fontWeight: "700" },
  testDiagnosticPanel: {
    position: "absolute",
    top: 50,
    left: 10,
    right: 10,
    backgroundColor: "rgba(17,24,39,0.92)",
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: "#fbbf24",
  },
  testDiagnosticLabel: {
    color: "#fbbf24",
    fontSize: 10,
    fontWeight: "700",
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  testDiagnosticText: { color: "#f9fafb", fontSize: 13, fontWeight: "600" },
  bottomControls: {
    position: "absolute",
    bottom: 10,
    left: 10,
    flexDirection: "row",
    gap: 8,
  },
  overlayBtn: {
    backgroundColor: "rgba(17,24,39,0.75)",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 16,
  },
  overlayBtnDanger: { backgroundColor: "rgba(220,38,38,0.75)" },
  overlayBtnText: { color: "white", fontSize: 12, fontWeight: "700" },
  configDivider: { borderTopWidth: 1, borderTopColor: "#333", marginVertical: 16 },
  configHint: { color: "#888", fontSize: 12, marginBottom: 10, lineHeight: 18 },
  resolutionOption: {
    borderWidth: 1,
    borderColor: "#444",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 6,
  },
  resolutionOptionActive: { borderColor: "#4CAF50", backgroundColor: "rgba(76,175,80,0.15)" },
  resolutionOptionText: { color: "#aaa", fontSize: 13 },
  resolutionOptionTextActive: { color: "#4CAF50", fontWeight: "700" },

  detailModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  detailModal: {
    width: "95%",
    maxHeight: "85%",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  detailHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  detailTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
    flexShrink: 1,
  },
  detailClose: {
    color: "#374151",
    fontWeight: "600",
    fontSize: 14,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  detailMetaGrid: { gap: 6, marginBottom: 12 },
  detailMetaText: { color: "#374151", fontSize: 13 },
  detailMetaLabel: { fontWeight: "700" },
  detailImage: {
    width: "100%",
    height: 200,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 12,
    backgroundColor: "#111827",
  },
  emptyEvidence: {
    padding: 10,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderStyle: "dashed",
    borderRadius: 8,
    marginBottom: 12,
  },
  emptyEvidenceText: { color: "#6b7280", fontSize: 13 },
  metadataBlock: {
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    padding: 10,
    maxHeight: 140,
    marginBottom: 12,
  },
  metadataText: { fontSize: 11, color: "#374151", fontFamily: "monospace" },
  resolveButton: {
    marginTop: 4,
    backgroundColor: "#065f46",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
  },
  resolveButtonDisabled: { opacity: 0.6 },
  resolveButtonText: { color: "white", fontWeight: "700", fontSize: 14 },

  configContainer: { flex: 1, backgroundColor: "#121212", padding: 40 },
  configFormScroll: {
    padding: 20,
    backgroundColor: "#1e1e1e",
    borderRadius: 8,
  },
  configTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    color: "white",
  },
  configLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 15,
    marginBottom: 5,
    color: "#ccc",
  },
  input: {
    borderWidth: 1,
    borderColor: "#444",
    padding: 10,
    borderRadius: 5,
    backgroundColor: "#333",
    marginBottom: 10,
    color: "white",
  },
  buttonContainer: { marginVertical: 8 },

  permissionContainer: {
    flex: 1,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  permissionCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 32,
    width: "100%",
    maxWidth: 420,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2d2d2d",
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(76, 175, 80, 0.12)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(76, 175, 80, 0.3)",
  },
  cameraIcon: {
    fontSize: 32,
  },
  permissionTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#000000",
    textAlign: "center",
    marginBottom: 12,
  },
  permissionDescription: {
    fontSize: 14,
    color: "#aaaaaa",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 28,
  },
  actionBtn: {
    backgroundColor: "#4CAF50",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
    marginBottom: 16,
  },
  actionBtnText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "bold",
    letterSpacing: 0.3,
  },
  permissionNotice: {
    fontSize: 11,
    color: "#666666",
    textAlign: "center",
    lineHeight: 16,
    fontStyle: "italic",
  },
});
