import React, { useRef, useEffect, useState } from "react";
import {
  SafeAreaView,
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
  Platform,
  useWindowDimensions,
  Vibration,
} from "react-native";
import {
  Camera,
  CameraView,
} from "expo-camera";
import * as FileSystem from "expo-file-system";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslation } from "react-i18next";

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

export default function DetectionScreen() {
  const { t, i18n } = useTranslation();
  const EVENT_LABELS = {
    touch_plant: t("touch_plant"),
    touch_animal: t("touch_animal"),
    plucking_plant: t("plucking_plant"),
    animal_strike: t("animal_strike"),
    extended_touch_animal: t("extended_touch_animal"),
    extended_touch_plant: t("extended_touch_plant"),
  };
  const { width } = useWindowDimensions();
  const isCompact = width < 720;
  const [hasPermission, setHasPermission] = useState(null);
  const cameraRef = useRef(null);
  const isCapturing = useRef(false);
  const lastLogTime = useRef(0);
  const lastFrameBase64 = useRef(null);
  const lastPhotoDimensions = useRef({ width: 640, height: 480 });
  const wsRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const torchFlashRef = useRef(null);
  const [torchEnabled, setTorchEnabled] = useState(false);

  const [serverConfig, setServerConfig] = useState({
    host: getAutoHost(),
    port: "8000",
  });
  const [tempConfig, setTempConfig] = useState({
    host: getAutoHost(),
    port: "8000",
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

  const ANOMALY_TYPE_OPTIONS = [
    "touching_plant",
    "touching_animal",
    "plucking_plants",
    "hitting_animal",
    "extended_plant_touch",
    "extended_animal_touch",
    "forest_fire",
    "flooding",
    "loud_noise",
    "trespassing",
  ];
  const [selectedAnomalyType, setSelectedAnomalyType] = useState("touching_plant");
  const [simulatingAnomaly, setSimulatingAnomaly] = useState(false);

  const [cameraLayout, setCameraLayout] = useState(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState("");

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

  const getEventLabel = (eventType) => {
    if (!eventType) return t("unknown_event");
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

  const isIotAnomaly = (event) => event?.metadata?.source === "iot_sensor";

  const formatEvidenceValue = (value) => {
    if (value === null || value === undefined || value === "") {
      return t("not_available");
    }
    return String(value);
  };

  const renderEvidenceValue = (value) => {
    if (Array.isArray(value)) {
      if (value.length === 0) {
        return <Text style={styles.evidenceValue}>{t("not_available")}</Text>;
      }

      return (
        <View style={styles.evidenceChipWrap}>
          {value.map((item, index) => (
            <Text key={`${item}-${index}`} style={styles.evidenceChip}>
              {formatEvidenceValue(item)}
            </Text>
          ))}
        </View>
      );
    }

    if (value && typeof value === "object") {
      const entries = Object.entries(value);

      if (entries.length === 0) {
        return <Text style={styles.evidenceValue}>{t("not_available")}</Text>;
      }

      return (
        <View style={styles.evidenceObjectList}>
          {entries.map(([key, nestedValue]) => (
            <View key={key} style={styles.evidenceObjectRow}>
              <Text style={styles.evidenceObjectKey}>{key}</Text>
              <Text style={styles.evidenceObjectValue}>
                {formatEvidenceValue(nestedValue)}
              </Text>
            </View>
          ))}
        </View>
      );
    }

    return <Text style={styles.evidenceValue}>{formatEvidenceValue(value)}</Text>;
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
        <View style={styles.evidencePanel}>
          <Text style={styles.evidenceTitle}>Sensor data</Text>
          {rows.map(([label, value]) => (
            <View key={label} style={styles.evidenceRow}>
              <Text style={styles.evidenceLabel}>{label}</Text>
              <View style={styles.evidenceValueContainer}>
                {renderEvidenceValue(value)}
              </View>
            </View>
          ))}
        </View>
      );
    }

    return event.annotated_frame_base64 ? (
      <Image
        source={{
          uri: `data:image/jpeg;base64,${event.annotated_frame_base64}`,
        }}
        style={styles.detailImage}
        resizeMode="contain"
      />
    ) : (
      <View style={styles.emptyEvidence}>
        <Text style={styles.emptyEvidenceText}>{t("no_annotated_frame")}</Text>
      </View>
    );
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
        };
        setServerConfig(loaded);
        setTempConfig(loaded);
      } catch {
        // Ignore corrupt storage
      }
    });
  }, []);

  useEffect(() => {
    Camera.getCameraPermissionsAsync()
      .then((permission) => setHasPermission(permission.granted))
      .catch(() => setHasPermission(false));
  }, []);

  const requestPermission = async () => {
    try {
      const permission = await Camera.requestCameraPermissionsAsync();
      setHasPermission(permission.granted);
    } catch {
      setHasPermission(false);
    }
  };

  // Persist config whenever it changes
  useEffect(() => {
    AsyncStorage.setItem(
      SERVER_CONFIG_STORAGE_KEY,
      JSON.stringify(serverConfig),
    ).catch(() => { });
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

  // 2. Fetch Anomaly Events (active only)
  const fetchAnomalyEvents = async () => {
    if (!currentUser) return;
    setEventsLoading(true);
    try {
      const response = await apiClient.get("/Anomaly-events", {
        params: {
          includeResolved: false,
          page: 1,
          size: 100,
          orderBy: "created_at desc",
        },
      });
      const data = response.data;

      let events = [];
      if (Array.isArray(data)) events = data;
      else if (data.data && Array.isArray(data.data)) events = data.data;
      else if (data.events && Array.isArray(data.events)) events = data.events;

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

      const ws = new WebSocket(
        `ws://${serverConfig.host}:${serverConfig.port}/ws/detect`,
      );
      wsRef.current = ws;

      ws.onopen = () => setIsConnected(true);

      ws.onmessage = (event) => {
        try {
          const result = JSON.parse(event.data);
          if (result && !result.error) setLatestResult(result);
        } catch { }
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

  // 4. Camera Capture Interval — sends frames over the open WebSocket.
  // Capture a lightweight frame from Expo Camera and send it over the open WebSocket.
  useEffect(() => {
    let isMounted = true;
    let frameTimeoutId = null;

    const processFrame = async () => {
      if (!isMounted) return;

      // CRITICAL FIX: Ensure camera layout exists and has actual physical size > 0
      const isLayoutReady = cameraLayout && cameraLayout.width > 0 && cameraLayout.height > 0;

      if (
        cameraRef.current &&
        cameraReady &&
        isLayoutReady && // Guard against the 0-width native crash!
        !isCapturing.current &&
        wsRef.current &&
        wsRef.current.readyState === WebSocket.OPEN
      ) {
        isCapturing.current = true;
        try {
          const photo = await cameraRef.current.takePictureAsync({
            quality: 0.1,            // Keeps data small for speedy YOLO transmission
            base64: true,
            skipProcessing: true,    // Fast pass
          });

          if (photo && isMounted) {
            lastPhotoDimensions.current = {
              width: photo.width || 640,
              height: photo.height || 480,
            };

            const base64Data = photo.base64;
            if (base64Data) {
              lastFrameBase64.current = base64Data;

              // Send to YOLO backend
              wsRef.current.send(
                JSON.stringify({
                  image_base64: base64Data,
                  user_id: currentUser?.id || 1,
                })
              );
            }
          }
        } catch (err) {
          console.log("Frame capture drop: ", err);
        } finally {
          isCapturing.current = false;
        }
      }

      // Loop execution schedule
      if (isMounted) {
        // Give the emulator a steady 1-second cadence to remain stable on local machines
        const stabilizationDelay = Platform.OS === 'android' && __DEV__ ? 1000 : 330;
        frameTimeoutId = setTimeout(processFrame, stabilizationDelay);
      }
    };

    // Only kick off the loop once user profile, native status, and layout width/height are real
    if (currentUser && cameraReady && cameraLayout?.width > 0) {
      processFrame();
    }

    return () => {
      isMounted = false;
      if (frameTimeoutId) clearTimeout(frameTimeoutId);
    };
  }, [currentUser, isConnected, cameraReady, cameraLayout]);

  // 5. Client-Side Anomaly Logging
  useEffect(() => {
    if (latestResult?.compliance && currentUser) {
      const {
        plucking_plant,
        animal_strike,
        extended_touch_animal,
        extended_touch_plant,
        touch_animal,
        touch_plant,
      } = latestResult.compliance;
      let detectedEventType = null;

      if (plucking_plant) detectedEventType = "plucking_plant";
      else if (animal_strike) detectedEventType = "animal_strike";
      else if (extended_touch_animal)
        detectedEventType = "extended_touch_animal";
      else if (extended_touch_plant) detectedEventType = "extended_touch_plant";
      else if (touch_animal) detectedEventType = "touch_animal";
      else if (touch_plant) detectedEventType = "touch_plant";

      if (detectedEventType) {
        const now = Date.now();
        if (now - lastLogTime.current > 3000) {
          lastLogTime.current = now;
          triggerAnomalyAlert();

          const confidenceCandidates = (latestResult?.detections || [])
            .map((d) => Number(d.confidence))
            .filter(Number.isFinite);
          const maxConfidence = confidenceCandidates.length
            ? Math.max(...confidenceCandidates)
            : null;

          const payload = {
            user_id: currentUser.id,
            event_type: detectedEventType,
            latitude: 1.5533,
            longitude: 110.3592,
            metadata: JSON.stringify({
              source: "mobile_ai_detection",
              timestamp: new Date().toISOString(),
              detection_confidence: maxConfidence,
              detections: latestResult?.detections?.length || 0,
              poses: latestResult?.poses?.length || 0,
              inference_ms: latestResult?.inference_ms || 0,
            }),
            annotated_frame_base64: lastFrameBase64.current,
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
              Alert.alert(
                t("database_error_title"),
                `${t("backend_rejected_anomaly_log")}\n${errorMsg}`,
              );
            });
        }
      }
    }
  }, [latestResult]);

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
        t("failed_resolve_anomaly_event");
      Alert.alert("Error", message);
    } finally {
      setResolvingEventId(null);
    }
  };

  const simulateAnomaly = async () => {
    if (!currentUser) {
      Alert.alert("Error", "User not loaded yet.");
      return;
    }
    setSimulatingAnomaly(true);
    try {
      const payload = {
        user_id: currentUser.id,
        event_type: selectedAnomalyType,
        latitude: 1.5533,
        longitude: 110.3592,
        metadata: JSON.stringify({
          source: "mobile_ai_detection",
          timestamp: new Date().toISOString(),
          detection_confidence: 0.95,
          detections: 1,
          poses: 1,
          inference_ms: 42,
          simulated: true,
        }),
        annotated_frame_base64: null,
      };
      await apiClient.post("/anomaly-events", payload);
      fetchAnomalyEvents();
      // Close config so CameraView is mounted, then fire the alert
      setConfigMode(false);
      setTimeout(() => triggerAnomalyAlert(), 150);
      Alert.alert("Anomaly Simulated", `'${getEventLabel(selectedAnomalyType)}' was logged successfully.`);
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || err.message;
      Alert.alert("Simulation Failed", msg);
    } finally {
      setSimulatingAnomaly(false);
    }
  };

  const triggerAnomalyAlert = () => {
    // Flash torch: toggle every 300 ms for 3 s (10 toggles = 5 on/off cycles)
    if (torchFlashRef.current) clearInterval(torchFlashRef.current);
    let tick = 0;
    setTorchEnabled(true);
    torchFlashRef.current = setInterval(() => {
      tick++;
      setTorchEnabled((prev) => !prev);
      if (tick >= 10) {
        clearInterval(torchFlashRef.current);
        torchFlashRef.current = null;
        setTorchEnabled(false);
      }
    }, 300);

    // Buzzing vibration pattern over ~3 s
    Vibration.vibrate([0, 400, 150, 400, 150, 400, 150, 400, 150, 400, 150, 400], false);
  };

  // Cleanup torch flash interval on unmount
  useEffect(() => {
    return () => {
      if (torchFlashRef.current) clearInterval(torchFlashRef.current);
    };
  }, []);

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
      <SafeAreaView style={styles.configScreen}>
        <ScrollView contentContainerStyle={styles.configScroll} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.configHeader}>
            <Text style={styles.configTitle}>{t("ai_server_configuration")}</Text>
            <TouchableOpacity
              style={styles.configCloseBtn}
              onPress={() => {
                setTempConfig(serverConfig);
                setConfigMode(false);
              }}
            >
              <Text style={styles.configCloseBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Connection status pill */}
          <View style={[styles.configStatusPill, { backgroundColor: isConnected ? "#ecfdf5" : "#fef2f2", borderColor: isConnected ? "#bbf7d0" : "#fecaca" }]}>
            <View style={[styles.configStatusDot, { backgroundColor: isConnected ? "#22c55e" : "#ef4444" }]} />
            <Text style={[styles.configStatusText, { color: isConnected ? "#166534" : "#991b1b" }]}>
              {isConnected ? t("connected_ai_api") : t("ai_server_disconnected")}
            </Text>
          </View>

          {/* Server Connection Section */}
          <View style={styles.configCard}>
            <Text style={styles.configSectionTitle}>{t("server_host")}</Text>
            <TextInput
              style={styles.configInput}
              placeholder={getAutoHost()}
              placeholderTextColor="#9ca3af"
              value={tempConfig.host}
              onChangeText={(v) => setTempConfig({ ...tempConfig, host: v })}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Text style={[styles.configSectionTitle, { marginTop: 16 }]}>{t("server_port")}</Text>
            <TextInput
              style={styles.configInput}
              placeholder="8000"
              placeholderTextColor="#9ca3af"
              value={tempConfig.port}
              onChangeText={(v) => setTempConfig({ ...tempConfig, port: v })}
              keyboardType="numeric"
            />

            {/* Save / Cancel */}
            <View style={styles.configActions}>
              <TouchableOpacity
                style={styles.configCancelBtn}
                onPress={() => {
                  setTempConfig(serverConfig);
                  setConfigMode(false);
                }}
              >
                <Text style={styles.configCancelBtnText}>{t("cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.configSaveBtn}
                onPress={() => {
                  setServerConfig({
                    host: (tempConfig.host || "").trim() || getAutoHost(),
                    port: (tempConfig.port || "").trim() || "8000",
                  });
                  setConfigMode(false);
                }}
              >
                <Text style={styles.configSaveBtnText}>{t("save")}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Simulate Anomaly Section */}
          <View style={styles.configCard}>
            <View style={styles.configSimulateHeader}>
              <View>
                <Text style={styles.configSectionTitle}>Simulate Anomaly</Text>
                <Text style={styles.configSectionHint}>Trigger a test event for debugging</Text>
              </View>
              <View style={styles.configDevBadge}>
                <Text style={styles.configDevBadgeText}>DEV</Text>
              </View>
            </View>

            <Text style={[styles.configSectionTitle, { marginTop: 14, marginBottom: 8 }]}>Event Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.configTypeScroll}>
              {ANOMALY_TYPE_OPTIONS.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.configTypePill,
                    selectedAnomalyType === type && styles.configTypePillActive,
                  ]}
                  onPress={() => setSelectedAnomalyType(type)}
                >
                  <Text style={[
                    styles.configTypePillText,
                    selectedAnomalyType === type && styles.configTypePillTextActive,
                  ]}>
                    {getEventLabel(type)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={[styles.configSimulateBtn, simulatingAnomaly && styles.configSimulateBtnDisabled]}
              onPress={simulateAnomaly}
              disabled={simulatingAnomaly}
            >
              {simulatingAnomaly
                ? <ActivityIndicator size="small" color="#ffffff" />
                : <Text style={styles.configSimulateBtnText}>Trigger Anomaly</Text>
              }
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // --- MAIN UI ---
  if (hasPermission === null) {
    return (
      <View style={styles.loadingView}>
        <Text style={{ color: "#888" }}>{t("loading_user_short")}</Text>
      </View>
    );
  }

  if (!hasPermission) {
    return (
      <View style={styles.permissionContainer}>
        <View style={styles.permissionCard}>
          <View style={styles.iconCircle}>
            <Text style={styles.cameraIcon}>
              <CameraIcon color="grey" />
            </Text>
          </View>

          <Text style={styles.permissionTitle}>
            {t("camera_access_required")}
          </Text>

          <Text style={styles.permissionDescription}>
            {t("camera_permission_description")}
          </Text>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={requestPermission}
            activeOpacity={0.8}
          >
            <Text style={styles.actionBtnText}>
              {t("grant_camera_permission")}
            </Text>
          </TouchableOpacity>

          <Text style={styles.permissionNotice}>
            {t("privacy_notice_camera")}
          </Text>
        </View>
      </View>
    );
  }
  if (userLoading)
    return (
      <View style={styles.loadingView}>
        <Text style={{ color: "#888" }}>{t("loading_user_short")}</Text>
      </View>
    );

  return (
    <SafeAreaView
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
                  <Text style={styles.detailClose}>{t("cancel")}</Text>
                </TouchableOpacity>
              </View>
              {selectedEvent && (
                <>
                  <View style={styles.detailMetaGrid}>
                    <Text style={styles.detailMetaText}>
                      <Text style={styles.detailMetaLabel}>
                        {t("detected")}:{" "}
                      </Text>
                      {new Date(selectedEvent.created_at).toLocaleString()}
                    </Text>
                    <Text style={styles.detailMetaText}>
                      <Text style={styles.detailMetaLabel}>
                        {t("confidence")}:{" "}
                      </Text>
                      {getEventConfidence(selectedEvent)}
                    </Text>
                    <Text style={styles.detailMetaText}>
                      <Text style={styles.detailMetaLabel}>
                        {t("latitude")}:{" "}
                      </Text>
                      {selectedEvent.latitude ?? t("not_available")}
                    </Text>
                    <Text style={styles.detailMetaText}>
                      <Text style={styles.detailMetaLabel}>
                        {t("longitude")}:{" "}
                      </Text>
                      {selectedEvent.longitude ?? t("not_available")}
                    </Text>
                  </View>
                  {renderEventEvidence(selectedEvent)}
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
                          ? t("resolving")
                          : t("mark_resolved")}
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
            <Text style={styles.title}>{t("ai_detection_dashboard")}</Text>
            <Text style={styles.pageSubtitle}>
              {t("monitor_anomaly_alerts")}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.refreshButtonContainer}
            onPress={fetchAnomalyEvents}
          >
            <Text style={styles.refreshButton}>{t("refresh")}</Text>
          </TouchableOpacity>
        </View>

        {eventsLoading ? (
          <Text style={{ color: "#888", marginTop: 20 }}>
            Loading events...
          </Text>
        ) : (
          <View style={styles.eventsPanel}>
            <View style={styles.panelHeader}>
              <Text style={styles.panelTitle}>{t("active_anomalies")}</Text>
              <View style={styles.badgeCount}>
                <Text style={styles.badgeCountText}>
                  {anomalyEvents.length}
                </Text>
              </View>
            </View>
            {anomalyEvents.length === 0 ? (
              <Text style={styles.emptyText}>{t("no_active_anomalies")}</Text>
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
                        <View style={styles.activePill}>
                          <Text style={styles.activePillText}>
                            {t("active")}
                          </Text>
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
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing="back"
            autofocus="on"
            mode="picture"
            active={true}
            animateShutter={false}
            enableTorch={torchEnabled}
            onCameraReady={() => {
              setCameraReady(true);
              setCameraError("");
            }}
            onMountError={(event) => {
              setCameraReady(false);
              setCameraError(
                event?.nativeEvent?.message || "Camera preview failed to start",
              );
            }}
          />
          {!cameraReady && (
            <View style={[styles.camera, styles.cameraLoading]}>
              <ActivityIndicator size="large" color="#4CAF50" />
              <Text style={styles.cameraLoadingText}>
                {cameraError || "Starting camera..."}
              </Text>
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
              {isConnected
                ? t("connected_ai_api")
                : t("ai_server_disconnected")}
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
                      {isTouching ? t("touch") : t("hand")}
                    </Text>
                  </View>
                );
              })}

            {/* Compliance Alerts */}
            {latestResult?.compliance?.plucking_plant && (
              <Text style={styles.warningText}>WARNING: PLUCKING DETECTED</Text>
            )}
            {latestResult?.compliance?.animal_strike && (
              <Text style={styles.warningText}>ALERT: ANIMAL STRIKE</Text>
            )}
            {latestResult?.compliance?.extended_touch_animal && (
              <Text
                style={[
                  styles.warningText,
                  { backgroundColor: "rgba(255, 165, 0, 0.8)" },
                ]}
              >
                EXTENDED ANIMAL TOUCH
              </Text>
            )}
            {latestResult?.compliance?.extended_touch_plant && (
              <Text
                style={[
                  styles.warningText,
                  { backgroundColor: "rgba(255, 165, 0, 0.8)" },
                ]}
              >
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

            {/* Settings Button */}
            <Text
              style={styles.settingsButton}
              onPress={() => setConfigMode(true)}
            >
              {t("config")}
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
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
  cameraLoading: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1e1e1e",
  },
  cameraLoadingText: {
    marginTop: 10,
    paddingHorizontal: 16,
    color: "#e5e7eb",
    fontSize: 12,
    textAlign: "center",
  },

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
  settingsButton: {
    position: "absolute",
    bottom: 10,
    left: 10,
    color: "white",
    fontSize: 12,
    fontWeight: "700",
    backgroundColor: "rgba(17,24,39,0.75)",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 16,
    overflow: "hidden",
  },

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
  evidencePanel: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    backgroundColor: "#ffffff",
  },
  evidenceTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  evidenceRow: {
    flexDirection: "row",
    gap: 10,
    paddingVertical: 7,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    alignItems: "flex-start",
  },
  evidenceLabel: {
    width: 110,
    color: "#6b7280",
    fontSize: 12,
    fontWeight: "700",
  },
  evidenceValue: {
    flex: 1,
    color: "#111827",
    fontSize: 13,
  },
  evidenceValueContainer: {
    flex: 1,
    minWidth: 0,
  },
  evidenceChipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  evidenceChip: {
    backgroundColor: "#f0fdf4",
    borderColor: "#bbf7d0",
    borderWidth: 1,
    borderRadius: 999,
    color: "#047857",
    fontSize: 12,
    fontWeight: "700",
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  evidenceObjectList: {
    gap: 6,
  },
  evidenceObjectRow: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: 5,
    paddingHorizontal: 8,
    backgroundColor: "#f9fafb",
    borderRadius: 6,
  },
  evidenceObjectKey: {
    width: 110,
    color: "#6b7280",
    fontSize: 12,
    fontWeight: "700",
  },
  evidenceObjectValue: {
    flex: 1,
    color: "#111827",
    fontSize: 12,
  },
  resolveButton: {
    marginTop: 4,
    backgroundColor: "#065f46",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
  },
  resolveButtonDisabled: { opacity: 0.6 },
  resolveButtonText: { color: "white", fontWeight: "700", fontSize: 14 },

  configScreen: { flex: 1, backgroundColor: "#f6f8f7" },
  configScroll: { padding: 20, paddingBottom: 40 },
  configHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  configTitle: { fontSize: 22, fontWeight: "700", color: "#111827" },
  configCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(168,168,168,0.25)",
    justifyContent: "center",
    alignItems: "center",
  },
  configCloseBtnText: { fontSize: 16, color: "#374151", fontWeight: "600" },
  configStatusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 99,
    borderWidth: 1,
    alignSelf: "flex-start",
    marginBottom: 20,
  },
  configStatusDot: { width: 8, height: 8, borderRadius: 4 },
  configStatusText: { fontSize: 13, fontWeight: "600" },
  configCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  configSectionTitle: { fontSize: 13, fontWeight: "600", color: "#111827", marginBottom: 6 },
  configSectionHint: { fontSize: 12, color: "#6b7280", marginTop: 2 },
  configInput: {
    borderWidth: 1,
    borderColor: "#2f6618fe",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: "#111827",
    backgroundColor: "#ffffff",
  },
  configActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  configCancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  configCancelBtnText: { fontSize: 14, fontWeight: "600", color: "#6b7280" },
  configSaveBtn: {
    flex: 1,
    backgroundColor: "#0a6340",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  configSaveBtnText: { fontSize: 14, fontWeight: "700", color: "#ffffff" },
  configSimulateHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  configDevBadge: {
    backgroundColor: "#fef3c7",
    borderWidth: 1,
    borderColor: "#fcd34d",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  configDevBadgeText: { fontSize: 11, fontWeight: "700", color: "#92400e" },
  configTypeScroll: { marginBottom: 16 },
  configTypePill: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 99,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    backgroundColor: "#f9fafb",
  },
  configTypePillActive: {
    backgroundColor: "#ecfdf5",
    borderColor: "#0a6340",
  },
  configTypePillText: { fontSize: 13, color: "#6b7280", fontWeight: "500" },
  configTypePillTextActive: { color: "#0a6340", fontWeight: "700" },
  configSimulateBtn: {
    backgroundColor: "#dc2626",
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: "center",
  },
  configSimulateBtnDisabled: { opacity: 0.6 },
  configSimulateBtnText: { fontSize: 14, fontWeight: "700", color: "#ffffff" },

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
