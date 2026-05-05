import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert, TextInput, ScrollView, Button } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useInference } from '../hooks/useInference';

// Skeleton edges for pose visualization (matches YOLO pose format)
const SKELETON_EDGES = [
  [0, 1], [0, 2], [1, 3], [2, 4],
  [5, 6], [5, 7], [7, 9], [6, 8], [8, 10],
  [5, 11], [6, 12], [11, 12],
  [11, 13], [13, 15], [12, 14], [14, 16],
];

export default function DetectionScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);
  const isCapturing = useRef(false);

  // Configuration state
  const [serverConfig, setServerConfig] = useState({ 
    port: '8000',
    userId: '260001',
  });
  const [configMode, setConfigMode] = useState(false);
  const [tempConfig, setTempConfig] = useState(serverConfig);

  // Anomaly events state
  const [anomalyEvents, setAnomalyEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [lastEventCount, setLastEventCount] = useState(0);

  // Construct WebSocket URL
  const ws_url = `ws://${serverConfig.host}:${serverConfig.port}/ws/detect?user_id=${serverConfig.userId}`;
  const { latestResult, isConnected, sendFrame } = useInference(ws_url);

  // Dynamically track the actual rendered size of the 4:3 camera container
  // Default to null so we don't render overlays until we have real dimensions
  const [cameraLayout, setCameraLayout] = useState(null);

  // Calculate scale factor relative to the server's 640x480 expected input
  // Only compute once we have real layout dimensions
  const SCALE_X = cameraLayout ? cameraLayout.width / 640 : 1;
  const SCALE_Y = cameraLayout ? cameraLayout.height / 480 : 1;

  // Mirror an X coordinate to correct for front-camera horizontal flip.
  // The server receives the raw (unmirrored) frame, but CameraView displays
  // it mirrored, so we flip all overlay X positions to match.
  const mirrorX = (x) => cameraLayout ? cameraLayout.width - x : x;

  // Helper function to render skeleton lines (using midpoint calculation for rotation)
  const renderSkeletonLine = (kp1, kp2, index) => {
    if (!kp1 || !kp2 || kp1.confidence < 0.3 || kp2.confidence < 0.3) return null;

    const x1 = mirrorX(kp1.x * SCALE_X);
    const y1 = kp1.y * SCALE_Y;
    const x2 = mirrorX(kp2.x * SCALE_X);
    const y2 = kp2.y * SCALE_Y;

    const dx = x2 - x1;
    const dy = y2 - y1;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);

    const cx = (x1 + x2) / 2;
    const cy = (y1 + y2) / 2;

    return (
      <View
        key={`line-${index}`}
        style={{
          position: 'absolute',
          left: cx - (distance / 2),
          top: cy - 1,
          width: distance,
          height: 2,
          backgroundColor: '#00FF00',
          transform: [{ rotate: `${angle}deg` }],
          opacity: 0.7,
        }}
      />
    );
  };

  // Helper function to render keypoint joints
  const renderKeypoint = (kp, index) => {
    if (!kp || kp.confidence < 0.3) return null;

    const x = mirrorX(kp.x * SCALE_X);
    const y = kp.y * SCALE_Y;
    const KP_RADIUS = 5;

    return (
      <View
        key={`kp-${index}`}
        style={{
          position: 'absolute',
          left: x - KP_RADIUS,
          top: y - KP_RADIUS,
          width: KP_RADIUS * 2,
          height: KP_RADIUS * 2,
          borderRadius: KP_RADIUS,
          backgroundColor: '#00FFFF',
          borderWidth: 1,
          borderColor: '#FFFFFF',
          opacity: 0.8,
        }}
      />
    );
  };

  useEffect(() => {
    const captureInterval = setInterval(async () => {
      if (!cameraRef.current || !isConnected || isCapturing.current) return;

      isCapturing.current = true;
      try {
        const photo = await cameraRef.current.takePictureAsync({ quality: 0.3, base64: false });
        const response = await fetch(photo.uri);
        const blob = await response.blob();
        sendFrame(blob);
      } catch (error) {
        console.log("Capture error:", error);
      } finally {
        isCapturing.current = false;
      }
    }, 250); 

    return () => clearInterval(captureInterval);
  }, [isConnected]);

  // Auto-discover server
  useEffect(() => {
    const discoverServer = async () => {
      try {
        const possibleHosts = [
          'localhost:8000',
          '127.0.0.1:8000',
          '192.168.1.1:8000',
          '192.168.0.1:8000',
        ];

        for (const host of possibleHosts) {
          try {
            const response = await fetch(`http://${host}/discover`, { timeout: 2000, method: 'GET' });
            if (response.ok) {
              const data = await response.json();
              setServerConfig({ host: data.host, port: data.port.toString(), userId: '1' });
              return;
            }
          } catch (e) {
            // Ignore timeout/error and try the next possible host
          }
        }
      } catch (error) {
        console.log('Discovery error:', error);
      }
    };
    discoverServer();
  }, []);

  // Fetch anomaly events for the user
  const fetchAnomalyEvents = async () => {
    setEventsLoading(true);
    try {
      const url = `http://${serverConfig.host}:5000/api/compliance-events/${serverConfig.userId}`;
      console.log("🔍 Fetching from:", url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
      
      console.log("📡 Response status:", response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log("✅ Full API Response:", JSON.stringify(data, null, 2));
        
        // Handle different response formats
        let events = [];
        if (Array.isArray(data)) {
          events = data;
          console.log("📋 Parsed as direct array, count:", events.length);
        } else if (data.data && Array.isArray(data.data)) {
          events = data.data;
          console.log("📋 Parsed from data.data, count:", events.length);
        } else if (data.events && Array.isArray(data.events)) {
          events = data.events;
          console.log("📋 Parsed from data.events, count:", events.length);
        } else {
          console.log("⚠️ Unknown response format:", Object.keys(data));
        }
        
        console.log("✅ Final events to display:", events);
        setAnomalyEvents(events);
        setLastEventCount(events.length);
      } else {
        const errorText = await response.text();
        console.log("❌ API error:", response.status, errorText);
        setAnomalyEvents([]);
      }
    } catch (error) {
      console.log('❌ Fetch error:', error);
      console.log('❌ Error details:', error.message);
      setAnomalyEvents([]);
    } finally {
      setEventsLoading(false);
    }
  };

  // Fetch events on mount
  useEffect(() => {
    fetchAnomalyEvents();
  }, [serverConfig.host, serverConfig.userId]);

  // Auto-refresh when new compliance event is detected from server
  useEffect(() => {
    if (latestResult?.compliance) {
      const currentPluckCount = latestResult.compliance.pluck_event_count ?? 0;
      const currentStrikeCount = latestResult.compliance.strike_event_count ?? 0;
      const currentTouchCount = latestResult.compliance.animal_extended_touch ? 1 : 0;
      
      // Trigger refresh if any new event detected
      if (currentPluckCount > 0 || currentStrikeCount > 0 || currentTouchCount > 0) {
        // Wait a moment for the event to be saved, then refresh
        const timer = setTimeout(() => {
          console.log("🔄 New compliance event detected, refreshing...");
          fetchAnomalyEvents();
        }, 1000);
        
        return () => clearTimeout(timer);
      }
    }
  }, [latestResult?.compliance?.pluck_event_count, latestResult?.compliance?.strike_event_count, latestResult?.compliance?.animal_extended_touch]);

  const handleSaveConfig = () => {
    setServerConfig(tempConfig);
    setConfigMode(false);
    Alert.alert('Configuration Updated', `Server: ${tempConfig.host}:${tempConfig.port}`);
  };

  const handleResetConfig = () => {
    setTempConfig(serverConfig);
    setConfigMode(false);
  };

  if (!permission) return <View />;
  if (!permission.granted) return <Text style={{marginTop: 50}} onPress={requestPermission}>Grant Camera Permission</Text>;

  if (configMode) {
    return (
      <View style={styles.configContainer}>
        <ScrollView style={styles.configForm}>
          <Text style={styles.configTitle}>AI Server Configuration</Text>
          <Text style={styles.label}>Server Host (IP Address)</Text>
          <TextInput
            style={styles.input}
            placeholder="192.168.1.100"
            value={tempConfig.host}
            onChangeText={(text) => setTempConfig({...tempConfig, host: text})}
          />
          <Text style={styles.label}>Server Port</Text>
          <TextInput
            style={styles.input}
            placeholder="8000"
            value={tempConfig.port}
            onChangeText={(text) => setTempConfig({...tempConfig, port: text})}
            keyboardType="numeric"
          />
          <Text style={styles.label}>User ID</Text>
          <TextInput
            style={styles.input}
            placeholder="1"
            value={tempConfig.userId}
            onChangeText={(text) => setTempConfig({...tempConfig, userId: text})}
            keyboardType="numeric"
          />
          <Text style={styles.hint}>
            To find your PC's IP: Open PowerShell and run `ipconfig`. Look for "IPv4 Address".
          </Text>
          <View style={styles.buttonContainer}>
            <Button title="Save Configuration" onPress={handleSaveConfig} color="#4CAF50" />
          </View>
          <View style={styles.buttonContainer}>
            <Button title="Cancel" onPress={handleResetConfig} color="#999" />
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.appContainer}>
      
      {/* LEFT PANEL: Anomaly Event Log */}
      <View style={styles.mainContent}>
        <View style={styles.titleBar}>
          <Text style={styles.title}>Anomaly Event Log</Text>
          <Text 
            style={styles.refreshButton}
            onPress={() => {
              console.log("🔄 Manual refresh");
              fetchAnomalyEvents();
            }}
          >
            🔄 Refresh
          </Text>
        </View>
        
        {eventsLoading ? (
          <Text style={{ color: '#888', marginTop: 20 }}>Loading events...</Text>
        ) : anomalyEvents.length === 0 ? (
          <Text style={{ color: '#888', marginTop: 20 }}>No anomaly events recorded</Text>
        ) : (
          <ScrollView style={styles.eventsList}>
            {anomalyEvents.map((event, index) => (
              <View key={index} style={styles.eventCard}>
                <View style={styles.eventHeader}>
                  <Text style={styles.eventType}>{event.event_type.toUpperCase()}</Text>
                  <Text 
                    style={[
                      styles.eventSeverity,
                      {
                        color: 
                          event.severity === 'high' ? '#FF4444' :
                          event.severity === 'medium' ? '#FFA500' :
                          '#FFD700'
                      }
                    ]}
                  >
                    {event.severity}
                  </Text>
                </View>
                <Text style={styles.eventDescription}>{event.description}</Text>
                <Text style={styles.eventTime}>
                  {new Date(event.created_at).toLocaleString()}
                </Text>
              </View>
            ))}
          </ScrollView>
        )}
      </View>

      {/* RIGHT PANEL: Fixed Aspect Ratio Camera */}
      <View style={styles.cameraSidebar}>
        <View 
          style={styles.cameraWrapper}
          onLayout={(event) => {
            const { width, height } = event.nativeEvent.layout;
            setCameraLayout({ width, height });
          }}
        >
          <CameraView ref={cameraRef} style={styles.camera} facing="back">
            
            {/* Status Indicator */}
            <Text style={styles.status}>
              {isConnected ? "🟢 Connected" : "🔴 Connecting..."}
            </Text>

            <Text style={styles.configIndicator}>
              Server: {serverConfig.host}:{serverConfig.port}
            </Text>

            {/* Detections Overlay — only render once we have real layout dimensions */}
            {cameraLayout && latestResult?.detections?.map((det, index) => {
              const [x1, y1, x2, y2] = det.bbox;
              const scaledX1 = mirrorX(x2 * SCALE_X); // flip: right edge becomes left
              const scaledY1 = y1 * SCALE_Y;
              const scaledW  = (x2 - x1) * SCALE_X;
              const scaledH  = (y2 - y1) * SCALE_Y;
              return (
                <View key={`det-${index}`} style={[styles.boundingBox, {
                  left: scaledX1,
                  top: scaledY1,
                  width: scaledW,
                  height: scaledH,
                }]}>
                  <Text style={styles.label}>
                    {det.class_name} {Math.round(det.confidence * 100)}%
                  </Text>
                </View>
              );
            })}

            {/* Pose Skeleton Overlay — only render once we have real layout dimensions */}
            {cameraLayout && latestResult?.poses?.map((pose, poseIndex) => {
              // The payload provides 'pose' as the array directly
              const keypoints = pose || [];
              return (
                <View key={`pose-${poseIndex}`} style={{ position: 'absolute', width: '100%', height: '100%' }}>
                  {/* Render skeleton lines */}
                  {SKELETON_EDGES.map((edge, edgeIndex) => {
                    const [from, to] = edge;
                    return renderSkeletonLine(keypoints[from], keypoints[to], `${poseIndex}-line-${edgeIndex}`);
                  })}
                  {/* Render keypoints */}
                  {keypoints.map((kp, kpIndex) => renderKeypoint(kp, `${poseIndex}-kp-${kpIndex}`))}
                </View>
              );
            })}


            {/* Hand Box Overlay — synthesized from pose wrist keypoints by the server */}
            {cameraLayout && latestResult?.compliance?.hand_boxes?.map((box, index) => {
              const [x1, y1, x2, y2] = box;
              const left   = mirrorX(x2 * SCALE_X);
              const top    = y1 * SCALE_Y;
              const width  = (x2 - x1) * SCALE_X;
              const height = (y2 - y1) * SCALE_Y;
              const isActive = (latestResult?.compliance?.hand_plant_overlaps ?? 0) > 0;
              return (
                <View
                  key={`hand-${index}`}
                  style={{
                    position: 'absolute',
                    left,
                    top,
                    width,
                    height,
                    borderWidth: 2,
                    borderColor: isActive ? '#FF6600' : '#FFD700',
                    backgroundColor: isActive
                      ? 'rgba(255, 102, 0, 0.20)'
                      : 'rgba(255, 215, 0, 0.12)',
                    borderRadius: 3,
                  }}
                >
                  <Text style={{
                    position: 'absolute',
                    top: -16,
                    left: 0,
                    color: isActive ? '#FF6600' : '#FFD700',
                    backgroundColor: 'black',
                    paddingHorizontal: 3,
                    fontSize: 10,
                    fontWeight: 'bold',
                  }}>
                    {isActive ? '\u270b TOUCH' : '\u270b'}
                  </Text>
                </View>
              );
            })}

            {/* Foot Box Overlay — synthesized from pose ankle keypoints by the server */}
            {cameraLayout && latestResult?.compliance?.foot_boxes?.map((box, index) => {
              const [x1, y1, x2, y2] = box;
              const left   = mirrorX(x2 * SCALE_X);
              const top    = y1 * SCALE_Y;
              const width  = (x2 - x1) * SCALE_X;
              const height = (y2 - y1) * SCALE_Y;
              return (
                <View
                  key={`foot-${index}`}
                  style={{
                    position: 'absolute',
                    left,
                    top,
                    width,
                    height,
                    borderWidth: 2,
                    borderColor: '#00BFFF',
                    backgroundColor: 'rgba(0, 191, 255, 0.12)',
                    borderRadius: 3,
                    borderStyle: 'dashed',
                  }}
                />
              );
            })}

            {/* Compliance Alerts */}
            {latestResult?.compliance?.plucking_active && (
              <Text style={styles.warningText}>WARNING: PLUCKING DETECTED</Text>
            )}
            {latestResult?.compliance?.animal_strike_active && (
               <Text style={styles.warningText}>ALERT: ANIMAL STRIKE</Text>
            )}
            {latestResult?.compliance?.animal_extended_touch && (
              <Text style={[styles.warningText, {backgroundColor: 'rgba(255, 165, 0, 0.8)'}]}>
                ⚠️ EXTENDED ANIMAL TOUCH
              </Text>
            )}

            {/* Live Stats Panel */}
            {latestResult && (
              <View style={styles.statsPanel}>
                <Text style={styles.statText}>Detections: {latestResult.detections?.length || 0}</Text>
                <Text style={styles.statText}>Poses: {latestResult.poses?.length || 0}</Text>
                <Text style={styles.statText}>Inference: {latestResult.inference_ms || 0}ms</Text>
              </View>
            )}

            {/* Settings Button */}
            <Text 
              style={styles.settingsButton}
              onPress={() => setConfigMode(true)}
            >
              ⚙️
            </Text>

          </CameraView>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Main Layout
  appContainer: { 
    flex: 1, 
    flexDirection: 'row', 
    backgroundColor: '#121212' 
  },
  mainContent: { 
    flex: 2, 
    padding: 20,
    justifyContent: 'flex-start',
    alignItems: 'stretch'
  },
  title: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    color: '#ffffff',
    marginBottom: 10
  },
  
  titleBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },

  refreshButton: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  
  // Event List
  eventsList: {
    flex: 1,
    marginTop: 10,
  },
  eventCard: {
    backgroundColor: '#1e1e1e',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#FF6600',
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventType: {
    color: '#00FF00',
    fontWeight: 'bold',
    fontSize: 14,
  },
  eventSeverity: {
    fontWeight: '600',
    fontSize: 12,
  },
  eventDescription: {
    color: '#cccccc',
    fontSize: 12,
    marginBottom: 6,
  },
  eventTime: {
    color: '#888888',
    fontSize: 10,
    fontStyle: 'italic',
  },
  
  // Camera Sidebar
  cameraSidebar: { 
    flex: 1, 
    backgroundColor: '#000000', 
    justifyContent: 'center', 
    padding: 10
  },
  cameraWrapper: {
    width: '100%',
    aspectRatio: 4 / 3, // Forces exact scaling ratio matching your backend
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#1e1e1e'
  },
  camera: { 
    flex: 1 
  },

  // Overlays
  status: { position: 'absolute', top: 10, left: 10, color: 'white', fontWeight: 'bold', fontSize: 12, backgroundColor: 'rgba(0,0,0,0.5)', padding: 6, borderRadius: 4 },
  configIndicator: { position: 'absolute', top: 40, left: 10, color: 'white', fontSize: 10, backgroundColor: 'rgba(0,0,0,0.5)', padding: 5, borderRadius: 3 },
  warningText: { position: 'absolute', top: 100, alignSelf: 'center', color: 'red', fontSize: 16, fontWeight: 'bold', backgroundColor: 'rgba(0,0,0,0.7)', padding: 8, borderRadius: 5 },
  statsPanel: { position: 'absolute', bottom: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.7)', padding: 10, borderRadius: 8 },
  statText: { color: 'white', fontSize: 10, marginVertical: 2 },
  settingsButton: { position: 'absolute', bottom: 10, left: 10, fontSize: 24, backgroundColor: 'rgba(0,0,0,0.6)', padding: 8, borderRadius: 25, overflow: 'hidden' },
  boundingBox: { position: 'absolute', borderWidth: 2, borderColor: 'lime', backgroundColor: 'rgba(50, 205, 50, 0.15)' },
  label: { position: 'absolute', top: -20, left: 0, color: 'lime', backgroundColor: 'black', paddingHorizontal: 4, fontSize: 12, fontWeight: 'bold' },

  // Config View
  configContainer: { flex: 1, backgroundColor: '#f5f5f5' },
  configForm: { padding: 20, marginTop: 40 },
  configTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', marginTop: 15, marginBottom: 5 },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 10, borderRadius: 5, backgroundColor: 'white', marginBottom: 10 },
  hint: { fontSize: 12, color: '#666', marginTop: 20, marginBottom: 20, fontStyle: 'italic' },
  buttonContainer: { marginVertical: 8 },
});