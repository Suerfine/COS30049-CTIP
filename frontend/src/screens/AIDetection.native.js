import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Button, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';

import apiClient from '../config/apiConfig';
import { DetectionService } from '../services/DetectionService';
import { userDashboardService } from '../services/userDashboardService';

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
  const lastLogTime = useRef(0);

  // Connection & Config State
  const [serverConfig, setServerConfig] = useState({ host: '172.17.104.136', port: '8000' });
  const [tempConfig, setTempConfig] = useState(serverConfig);
  const [configMode, setConfigMode] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const [latestResult, setLatestResult] = useState(null); 
  const [currentUser, setCurrentUser] = useState(null);
  const [userLoading, setUserLoading] = useState(true);

  const [anomalyEvents, setAnomalyEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);

  const [cameraLayout, setCameraLayout] = useState(null);
  const SCALE_X = cameraLayout ? cameraLayout.width / 640 : 1;
  const SCALE_Y = cameraLayout ? cameraLayout.height / 480 : 1;
  const mirrorX = (x) => cameraLayout ? cameraLayout.width - x : x;

  // 1. Fetch Current User
  useEffect(() => {
    const fetchCurrentUser = async () => {
      setUserLoading(true);
      try {
        const data = await userDashboardService.getUserProfile();
        setCurrentUser(data);
      } catch (error) {
        setCurrentUser({ id: 260001, username: 'default_user' });
      } finally {
        setUserLoading(false);
      }
    };
    fetchCurrentUser();
  }, []);

  // 2. Fetch Anomaly Events
  const fetchAnomalyEvents = async () => {
    if (!currentUser) return;
    setEventsLoading(true);
    try {
      // FIX 1: Changed to lowercase /anomaly-events to match standard Express routing
      const response = await apiClient.get(`/anomaly-events/${currentUser.id}`);
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

  // 3. Health Check: Ping the AI server continuously
  useEffect(() => {
    const pingServer = async () => {
      try {
        const res = await fetch(`http://${serverConfig.host}:${serverConfig.port}/health`, { timeout: 2000 });
        setIsConnected(res.status === 200);
      } catch {
        setIsConnected(false);
      }
    };
    pingServer();
    const interval = setInterval(pingServer, 3000);
    return () => clearInterval(interval);
  }, [serverConfig.host, serverConfig.port]);

  // 4. Camera Capture Interval using DetectionService POST
  useEffect(() => {
    const captureInterval = setInterval(async () => {
      if (!cameraRef.current || isCapturing.current || !isConnected) return;

      isCapturing.current = true;
      try {
        const photo = await cameraRef.current.takePictureAsync({ quality: 0.3, base64: true });
        
        const result = await DetectionService.analyzeFrame(
          photo.base64, 
          currentUser?.id, 
          serverConfig.host, 
          serverConfig.port
        );
        
        if (result && !result.error) {
          setLatestResult(result);
        }
      } catch (error) {
        // Silently ignore capture errors
      } finally {
        isCapturing.current = false;
      }
    }, 250); 

    return () => clearInterval(captureInterval);
  }, [currentUser, isConnected, serverConfig]);

  // 5. Client-Side Anomaly Logging
  useEffect(() => {
    if (latestResult?.compliance && currentUser) {
      const { 
        plucking_plant, 
        animal_strike, 
        extended_touch_animal, 
        extended_touch_plant,
        touch_animal,
        touch_plant
      } = latestResult.compliance;
      
      let detectedEventType = null;

      // FIX 2: Relational Databases use strict Enums. 
      // We must send the exact lowercase strings the database expects.
      // (Your UI component will still automatically render it as uppercase)
      if (plucking_plant) detectedEventType = 'plucking_plant';
      else if (animal_strike) detectedEventType = 'animal_strike';
      else if (extended_touch_animal) detectedEventType = 'extended_touch_animal';
      else if (extended_touch_plant) detectedEventType = 'extended_touch_plant';
      else if (touch_animal) detectedEventType = 'touch_animal';
      else if (touch_plant) detectedEventType = 'touch_plant';

      if (detectedEventType) {
        const now = Date.now();
        // 3-second cooldown to avoid flooding the database
        if (now - lastLogTime.current > 3000) {
          lastLogTime.current = now;
          
          const payload = {
            user_id: currentUser.id,
            event_type: detectedEventType,
            latitude: 1.5533,      // Default Park Latitude
            longitude: 110.3592,   // Default Park Longitude
            // FIX 3: Safely stringified the metadata object so Express parsers don't choke
            metadata: JSON.stringify({ 
              source: "mobile_ai_detection",
              timestamp: new Date().toISOString()
            })
          };

          // POST using the strictly lowercase path
          apiClient.post('/anomaly-events', payload)
            .then(() => {
              console.log(`✅ Logged ${detectedEventType} successfully!`);
              fetchAnomalyEvents();
            })
            .catch((err) => {
              // ERROR CATCHER: This will show an alert box if your Express server rejects the payload!
              const errorMsg = err.response?.data?.message || err.response?.data?.error || err.message;
              console.error("❌ DB REJECTED EVENT:", err.response?.data || err.message);
              Alert.alert("Database Error", `Backend rejected the anomaly log:\n${errorMsg}`);
            });
        }
      }
    }
  }, [latestResult]);

  // --- RENDER HELPERS ---
  const renderSkeletonLine = (kp1, kp2, index) => {
    if (!kp1 || !kp2 || kp1.confidence < 0.3 || kp2.confidence < 0.3) return null;
    const x1 = mirrorX(kp1.x * SCALE_X), y1 = kp1.y * SCALE_Y;
    const x2 = mirrorX(kp2.x * SCALE_X), y2 = kp2.y * SCALE_Y;
    const dx = x2 - x1, dy = y2 - y1;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    const cx = (x1 + x2) / 2, cy = (y1 + y2) / 2;

    return (
      <View key={`line-${index}`} style={{
        position: 'absolute', left: cx - (distance / 2), top: cy - 1, width: distance, height: 2,
        backgroundColor: '#00FF00', transform: [{ rotate: `${angle}deg` }], opacity: 0.7,
      }} />
    );
  };

  const renderKeypoint = (kp, index) => {
    if (!kp || kp.confidence < 0.3) return null;
    const x = mirrorX(kp.x * SCALE_X), y = kp.y * SCALE_Y;
    const KP_RADIUS = 5;

    return (
      <View key={`kp-${index}`} style={{
        position: 'absolute', left: x - KP_RADIUS, top: y - KP_RADIUS, width: KP_RADIUS * 2, height: KP_RADIUS * 2,
        borderRadius: KP_RADIUS, backgroundColor: '#00FFFF', borderWidth: 1, borderColor: '#FFFFFF', opacity: 0.8,
      }} />
    );
  };

  // --- CONFIG UI ---
  if (configMode) {
    return (
      <View style={styles.configContainer}>
        <ScrollView style={styles.configForm}>
          <Text style={styles.configTitle}>AI Server Configuration</Text>
          <Text style={styles.label}>Server Host (IP Address)</Text>
          <TextInput style={styles.input} placeholder="172.17.104.136" value={tempConfig.host} onChangeText={(t) => setTempConfig({...tempConfig, host: t})} />
          <Text style={styles.label}>Server Port</Text>
          <TextInput style={styles.input} placeholder="8000" value={tempConfig.port} onChangeText={(t) => setTempConfig({...tempConfig, port: t})} keyboardType="numeric" />
          <View style={styles.buttonContainer}><Button title="Save" onPress={() => { setServerConfig(tempConfig); setConfigMode(false); }} color="#4CAF50" /></View>
          <View style={styles.buttonContainer}><Button title="Cancel" onPress={() => { setTempConfig(serverConfig); setConfigMode(false); }} color="#999" /></View>
        </ScrollView>
      </View>
    );
  }

  // --- MAIN UI ---
  if (!permission) return <View />;
  if (!permission.granted) return <Text style={{marginTop: 50, color: 'white'}} onPress={requestPermission}>Grant Camera Permission</Text>;
  if (userLoading) return <View style={styles.loadingView}><Text style={{color: '#888'}}>Loading user...</Text></View>;

  return (
    <View style={styles.appContainer}>
      
      {/* LEFT PANEL: Anomaly Event Log */}
      <View style={styles.mainContent}>
        <View style={styles.titleBar}>
          <Text style={styles.title}>Anomaly Event Log</Text>
          <Text style={styles.refreshButton} onPress={fetchAnomalyEvents}>🔄 Refresh</Text>
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
                </View>
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
          onLayout={(event) => setCameraLayout({ width: event.nativeEvent.layout.width, height: event.nativeEvent.layout.height })}
        >
          <CameraView ref={cameraRef} style={styles.camera} facing="back">
            
            <Text style={[styles.status, { backgroundColor: isConnected ? 'rgba(0,128,0,0.7)' : 'rgba(255,0,0,0.7)' }]}>
              {isConnected ? "🟢 Connected (API)" : "🔴 AI Server Disconnected"}
            </Text>

            {/* Detections Overlay */}
            {isConnected && cameraLayout && latestResult?.detections?.map((det, index) => {
              const [x1, y1, x2, y2] = det.bbox;
              return (
                <View key={`det-${index}`} style={[styles.boundingBox, { left: mirrorX(x2 * SCALE_X), top: y1 * SCALE_Y, width: (x2 - x1) * SCALE_X, height: (y2 - y1) * SCALE_Y }]}>
                  <Text style={styles.label}>{det.class_name} {Math.round(det.confidence * 100)}%</Text>
                </View>
              );
            })}

            {/* Pose Skeleton Overlay */}
            {isConnected && cameraLayout && latestResult?.poses?.map((pose, poseIndex) => (
                <View key={`pose-${poseIndex}`} style={{ position: 'absolute', width: '100%', height: '100%' }}>
                  {SKELETON_EDGES.map((edge, edgeIndex) => renderSkeletonLine(pose[edge[0]], pose[edge[1]], `${poseIndex}-line-${edgeIndex}`))}
                  {pose.map((kp, kpIndex) => renderKeypoint(kp, `${poseIndex}-kp-${kpIndex}`))}
                </View>
            ))}

            {/* Hand Box Overlay */}
            {isConnected && cameraLayout && latestResult?.compliance?.hand_boxes?.map((box, index) => {
              const isTouching = latestResult.compliance.touch_plant || latestResult.compliance.touch_animal;
              
              return (
                <View key={`hand-${index}`} style={[styles.interactionBox, {
                    left: mirrorX(box[2] * SCALE_X), top: box[1] * SCALE_Y, width: (box[2] - box[0]) * SCALE_X, height: (box[3] - box[1]) * SCALE_Y,
                    borderColor: isTouching ? '#FF6600' : '#FFD700',
                    backgroundColor: isTouching ? 'rgba(255, 102, 0, 0.20)' : 'rgba(255, 215, 0, 0.12)',
                  }]}
                >
                  <Text style={[styles.interactionLabel, { color: isTouching ? '#FF6600' : '#FFD700' }]}>
                    {isTouching ? '\u270b TOUCH' : '\u270b'}
                  </Text>
                </View>
              );
            })}

            {/* Compliance Alerts */}
            {latestResult?.compliance?.plucking_plant && <Text style={styles.warningText}>WARNING: PLUCKING DETECTED</Text>}
            {latestResult?.compliance?.animal_strike && <Text style={styles.warningText}>ALERT: ANIMAL STRIKE</Text>}
            {latestResult?.compliance?.extended_touch_animal && <Text style={[styles.warningText, {backgroundColor: 'rgba(255, 165, 0, 0.8)'}]}>⚠️ EXTENDED ANIMAL TOUCH</Text>}
            {latestResult?.compliance?.extended_touch_plant && <Text style={[styles.warningText, {backgroundColor: 'rgba(255, 165, 0, 0.8)'}]}>⚠️ EXTENDED PLANT TOUCH</Text>}

            {/* Live Stats Panel */}
            {isConnected && latestResult && (
              <View style={styles.statsPanel}>
                <Text style={styles.statText}>Detections: {latestResult.detections?.length || 0}</Text>
                <Text style={styles.statText}>Poses: {latestResult.poses?.length || 0}</Text>
                <Text style={styles.statText}>Inference: {latestResult.inference_ms || 0}ms</Text>
              </View>
            )}

            {/* Settings Button */}
            <Text style={styles.settingsButton} onPress={() => setConfigMode(true)}>⚙️</Text>

          </CameraView>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  appContainer: { flex: 1, flexDirection: 'row', backgroundColor: '#121212' },
  mainContent: { flex: 2, padding: 20, justifyContent: 'flex-start', alignItems: 'stretch' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#ffffff', marginBottom: 10 },
  titleBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  refreshButton: { fontSize: 14, fontWeight: '600', color: '#4CAF50', backgroundColor: 'rgba(76, 175, 80, 0.15)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, borderWidth: 1, borderColor: '#4CAF50' },
  loadingView: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212' },
  
  eventsList: { flex: 1, marginTop: 10 },
  eventCard: { backgroundColor: '#1e1e1e', borderRadius: 8, padding: 12, marginBottom: 10, borderLeftWidth: 4, borderLeftColor: '#FF6600' },
  eventHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  eventType: { color: '#00FF00', fontWeight: 'bold', fontSize: 14 },
  eventTime: { color: '#888888', fontSize: 10, fontStyle: 'italic' },
  
  cameraSidebar: { flex: 1, backgroundColor: '#000000', justifyContent: 'center', padding: 10 },
  cameraWrapper: { width: '100%', aspectRatio: 4 / 3, borderRadius: 8, overflow: 'hidden', backgroundColor: '#1e1e1e' },
  camera: { flex: 1 },

  status: { position: 'absolute', top: 10, left: 10, color: 'white', fontWeight: 'bold', fontSize: 12, padding: 6, borderRadius: 4 },
  warningText: { position: 'absolute', top: 100, alignSelf: 'center', color: 'red', fontSize: 16, fontWeight: 'bold', backgroundColor: 'rgba(0,0,0,0.7)', padding: 8, borderRadius: 5 },
  statsPanel: { position: 'absolute', bottom: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.7)', padding: 10, borderRadius: 8 },
  statText: { color: 'white', fontSize: 10, marginVertical: 2 },
  boundingBox: { position: 'absolute', borderWidth: 2, borderColor: 'lime', backgroundColor: 'rgba(50, 205, 50, 0.15)' },
  label: { position: 'absolute', top: -20, left: 0, color: 'lime', backgroundColor: 'black', paddingHorizontal: 4, fontSize: 12, fontWeight: 'bold' },
  interactionBox: { position: 'absolute', borderWidth: 2, borderRadius: 3 },
  interactionLabel: { position: 'absolute', top: -16, left: 0, backgroundColor: 'black', paddingHorizontal: 3, fontSize: 10, fontWeight: 'bold' },
  settingsButton: { position: 'absolute', bottom: 10, left: 10, fontSize: 24, backgroundColor: 'rgba(0,0,0,0.6)', padding: 8, borderRadius: 25, overflow: 'hidden' },

  configContainer: { flex: 1, backgroundColor: '#121212', padding: 40 },
  configForm: { padding: 20, backgroundColor: '#1e1e1e', borderRadius: 8 },
  configTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, color: 'white' },
  label: { fontSize: 14, fontWeight: '600', marginTop: 15, marginBottom: 5, color: '#ccc' },
  input: { borderWidth: 1, borderColor: '#444', padding: 10, borderRadius: 5, backgroundColor: '#333', marginBottom: 10, color: 'white' },
  buttonContainer: { marginVertical: 8 },
});