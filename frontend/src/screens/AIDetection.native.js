import React, { useRef, useEffect, useState } from 'react';

// Inline mock services to ensure the component compiles as a single standalone file
const userDashboardService = {
  getUserProfile: async () => ({ id: 260001, username: 'default_user' })
};

const apiClient = {
  get: async (url) => {
    console.log(`[Mock GET] ${url}`);
    return { data: [] }; // Mock empty anomaly list for preview
  },
  post: async (url, data) => {
    console.log(`[Mock POST] ${url}`, data);
    return { data: { success: true } };
  }
};

const DetectionService = {
  analyzeFrame: async (imageBase64, userId, aiHost, aiPort) => {
    try {
      const endpoint = (aiHost && aiPort) 
          ? `http://${aiHost}:${aiPort}/detect`
          : 'http://localhost:8000/detect';

      let cleanBase64 = imageBase64;
      if (cleanBase64.includes(',')) {
          cleanBase64 = cleanBase64.split(',')[1];
      }
      const paddingNeeded = cleanBase64.length % 4;
      if (paddingNeeded > 0) {
          cleanBase64 += '='.repeat(4 - paddingNeeded);
      }

      const response = await fetch(endpoint, {
          method: 'POST',
          body: JSON.stringify({
              image_base64: cleanBase64,
              user_id: userId ? parseInt(userId) : 1
          }),
          headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
          },
      });

      if (!response.ok) {
          throw new Error(`HTTP Error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      return null;
    }
  }
};

const SKELETON_EDGES = [
  [0, 1], [0, 2], [1, 3], [2, 4],
  [5, 6], [5, 7], [7, 9], [6, 8], [8, 10],
  [5, 11], [6, 12], [11, 12],
  [11, 13], [13, 15], [12, 14], [14, 16],
];

export default function DetectionScreenWeb() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const isCapturing = useRef(false);
  const lastLogTime = useRef(0);

  const [permissionGranted, setPermissionGranted] = useState(false);
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
  
  // Safe scaling based on intrinsic video resolution vs rendered UI size
  const SCALE_X = cameraLayout ? cameraLayout.width / cameraLayout.videoWidth : 1;
  const SCALE_Y = cameraLayout ? cameraLayout.height / cameraLayout.videoHeight : 1;
  const mirrorX = (x) => cameraLayout ? cameraLayout.width - x : x;

  // 1. Start Native Web Camera
  useEffect(() => {
    let stream = null;
    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setPermissionGranted(true);
      } catch (err) {
        console.error("Camera access denied:", err);
        setPermissionGranted(false);
      }
    };
    startCamera();
    return () => {
      if (stream) stream.getTracks().forEach(track => track.stop());
    };
  }, []);

  // Track layout changes for accurate overlay mapping
  useEffect(() => {
    const updateLayout = () => {
      if (videoRef.current && videoRef.current.videoWidth > 0) {
        setCameraLayout({
          width: videoRef.current.clientWidth,
          height: videoRef.current.clientHeight,
          videoWidth: videoRef.current.videoWidth,
          videoHeight: videoRef.current.videoHeight
        });
      }
    };
    window.addEventListener('resize', updateLayout);
    // Poll briefly to catch when the video metadata loads
    const layoutInterval = setInterval(updateLayout, 1000); 
    return () => {
      window.removeEventListener('resize', updateLayout);
      clearInterval(layoutInterval);
    };
  }, []);

  // 2. Fetch User & Events
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

  const fetchAnomalyEvents = async () => {
    if (!currentUser) return;
    setEventsLoading(true);
    try {
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

  // 3. Health Check
  useEffect(() => {
    const pingServer = async () => {
      try {
        const res = await fetch(`http://${serverConfig.host}:${serverConfig.port}/health`, { 
          method: 'GET',
        });
        setIsConnected(res.status === 200);
      } catch {
        setIsConnected(false);
      }
    };
    pingServer();
    const interval = setInterval(pingServer, 3000);
    return () => clearInterval(interval);
  }, [serverConfig.host, serverConfig.port]);

  // Helper: Extract Frame to Base64 via Canvas
  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current) return null;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video.videoWidth === 0) return null;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const dataUrl = canvas.toDataURL('image/jpeg', 0.3);
    return dataUrl.split(',')[1]; // Strip prefix
  };

  // 4. Capture Loop
  useEffect(() => {
    const captureInterval = setInterval(async () => {
      if (!videoRef.current || isCapturing.current || !isConnected) return;

      isCapturing.current = true;
      try {
        const base64Photo = captureFrame();
        if (base64Photo) {
          const result = await DetectionService.analyzeFrame(
            base64Photo, 
            currentUser?.id, 
            serverConfig.host, 
            serverConfig.port
          );
          if (result && !result.error) setLatestResult(result);
        }
      } catch (error) {
        // Silently ignore
      } finally {
        isCapturing.current = false;
      }
    }, 250); 

    return () => clearInterval(captureInterval);
  }, [currentUser, isConnected, serverConfig]);

  // 5. Client-Side Anomaly Logging
  useEffect(() => {
    if (latestResult?.compliance && currentUser) {
      const { plucking_plant, animal_strike, extended_touch_animal, extended_touch_plant, touch_animal, touch_plant } = latestResult.compliance;
      let detectedEventType = null;

      if (plucking_plant) detectedEventType = 'plucking_plant';
      else if (animal_strike) detectedEventType = 'animal_strike';
      else if (extended_touch_animal) detectedEventType = 'extended_touch_animal';
      else if (extended_touch_plant) detectedEventType = 'extended_touch_plant';
      else if (touch_animal) detectedEventType = 'touch_animal';
      else if (touch_plant) detectedEventType = 'touch_plant';

      if (detectedEventType) {
        const now = Date.now();
        if (now - lastLogTime.current > 3000) {
          lastLogTime.current = now;
          
          const payload = {
            user_id: currentUser.id,
            event_type: detectedEventType,
            latitude: 1.5533,      
            longitude: 110.3592,   
            metadata: JSON.stringify({ source: "web_ai_detection", timestamp: new Date().toISOString() })
          };

          apiClient.post('/anomaly-events', payload)
            .then(() => {
              fetchAnomalyEvents();
            })
            .catch((err) => {
              const errorMsg = err.response?.data?.message || err.response?.data?.error || err.message;
              window.alert(`Database Error:\nBackend rejected the anomaly log:\n${errorMsg}`);
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
      <div key={`line-${index}`} style={{
        position: 'absolute', left: cx - (distance / 2), top: cy - 1, width: distance, height: 2,
        backgroundColor: '#00FF00', transform: `rotate(${angle}deg)`, opacity: 0.7,
      }} />
    );
  };

  const renderKeypoint = (kp, index) => {
    if (!kp || kp.confidence < 0.3) return null;
    const x = mirrorX(kp.x * SCALE_X), y = kp.y * SCALE_Y;
    const KP_RADIUS = 5;

    return (
      <div key={`kp-${index}`} style={{
        position: 'absolute', left: x - KP_RADIUS, top: y - KP_RADIUS, width: KP_RADIUS * 2, height: KP_RADIUS * 2,
        borderRadius: KP_RADIUS, backgroundColor: '#00FFFF', border: '1px solid #FFFFFF', opacity: 0.8,
      }} />
    );
  };

  // --- CONFIG UI ---
  if (configMode) {
    return (
      <div style={styles.configContainer}>
        <div style={styles.configForm}>
          <h2 style={styles.configTitle}>AI Server Configuration</h2>
          <span style={styles.configLabel}>Server Host (IP Address)</span>
          <input style={styles.input} placeholder="172.17.104.136" value={tempConfig.host} onChange={(e) => setTempConfig({...tempConfig, host: e.target.value})} />
          <span style={styles.configLabel}>Server Port</span>
          <input style={styles.input} placeholder="8000" type="number" value={tempConfig.port} onChange={(e) => setTempConfig({...tempConfig, port: e.target.value})} />
          <div style={styles.buttonContainer}><button style={styles.buttonSave} onClick={() => { setServerConfig(tempConfig); setConfigMode(false); }}>Save</button></div>
          <div style={styles.buttonContainer}><button style={styles.buttonCancel} onClick={() => { setTempConfig(serverConfig); setConfigMode(false); }}>Cancel</button></div>
        </div>
      </div>
    );
  }

  // --- MAIN UI ---
  if (!permissionGranted) return <div style={{padding: 50, color: 'white'}}>Requesting Camera Permission... Please allow in browser.</div>;
  if (userLoading) return <div style={styles.loadingView}>Loading user...</div>;

  return (
    <div style={styles.appContainer}>
      
      {/* Hidden Canvas for extracting base64 frames */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* LEFT PANEL: Anomaly Event Log */}
      <div style={styles.mainContent}>
        <div style={styles.titleBar}>
          <h1 style={styles.title}>Anomaly Event Log</h1>
          <button style={styles.refreshButton} onClick={fetchAnomalyEvents}>🔄 Refresh</button>
        </div>
        
        {eventsLoading ? (
          <span style={{ color: '#888', marginTop: 20 }}>Loading events...</span>
        ) : anomalyEvents.length === 0 ? (
          <span style={{ color: '#888', marginTop: 20 }}>No anomaly events recorded</span>
        ) : (
          <div style={styles.eventsList}>
            {anomalyEvents.map((event, index) => (
              <div key={index} style={styles.eventCard}>
                <div style={styles.eventHeader}>
                  <span style={styles.eventType}>{event.event_type.toUpperCase()}</span>
                </div>
                <span style={styles.eventTime}>
                  {new Date(event.created_at).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* RIGHT PANEL: Fixed Aspect Ratio Web Camera */}
      <div style={styles.cameraSidebar}>
        <div style={styles.cameraWrapper}>
          
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            style={styles.camera} 
          />
            
          <span style={{...styles.status, backgroundColor: isConnected ? 'rgba(0,128,0,0.7)' : 'rgba(255,0,0,0.7)'}}>
            {isConnected ? "🟢 Connected (API)" : "🔴 AI Server Disconnected"}
          </span>

          {/* Detections Overlay */}
          {isConnected && cameraLayout && latestResult?.detections?.map((det, index) => {
            const [x1, y1, x2, y2] = det.bbox;
            return (
              <div key={`det-${index}`} style={{...styles.boundingBox, left: mirrorX(x2 * SCALE_X), top: y1 * SCALE_Y, width: (x2 - x1) * SCALE_X, height: (y2 - y1) * SCALE_Y }}>
                <span style={styles.label}>{det.class_name} {Math.round(det.confidence * 100)}%</span>
              </div>
            );
          })}

          {/* Pose Skeleton Overlay */}
          {isConnected && cameraLayout && latestResult?.poses?.map((pose, poseIndex) => (
              <div key={`pose-${poseIndex}`} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                {SKELETON_EDGES.map((edge, edgeIndex) => renderSkeletonLine(pose[edge[0]], pose[edge[1]], `${poseIndex}-line-${edgeIndex}`))}
                {pose.map((kp, kpIndex) => renderKeypoint(kp, `${poseIndex}-kp-${kpIndex}`))}
              </div>
          ))}

          {/* Hand Box Overlay */}
          {isConnected && cameraLayout && latestResult?.compliance?.hand_boxes?.map((box, index) => {
            const isTouching = latestResult.compliance.touch_plant || latestResult.compliance.touch_animal;
            return (
              <div key={`hand-${index}`} style={{...styles.interactionBox,
                  left: mirrorX(box[2] * SCALE_X), top: box[1] * SCALE_Y, width: (box[2] - box[0]) * SCALE_X, height: (box[3] - box[1]) * SCALE_Y,
                  borderColor: isTouching ? '#FF6600' : '#FFD700',
                  backgroundColor: isTouching ? 'rgba(255, 102, 0, 0.20)' : 'rgba(255, 215, 0, 0.12)',
                }}
              >
                <span style={{...styles.interactionLabel, color: isTouching ? '#FF6600' : '#FFD700' }}>
                  {isTouching ? '\u270b TOUCH' : '\u270b'}
                </span>
              </div>
            );
          })}

          {/* Compliance Alerts */}
          {latestResult?.compliance?.plucking_plant && <div style={styles.warningText}>WARNING: PLUCKING DETECTED</div>}
          {latestResult?.compliance?.animal_strike && <div style={styles.warningText}>ALERT: ANIMAL STRIKE</div>}
          {latestResult?.compliance?.extended_touch_animal && <div style={{...styles.warningText, backgroundColor: 'rgba(255, 165, 0, 0.8)'}}>⚠️ EXTENDED ANIMAL TOUCH</div>}
          {latestResult?.compliance?.extended_touch_plant && <div style={{...styles.warningText, backgroundColor: 'rgba(255, 165, 0, 0.8)'}}>⚠️ EXTENDED PLANT TOUCH</div>}

          {/* Live Stats Panel */}
          {isConnected && latestResult && (
            <div style={styles.statsPanel}>
              <div style={styles.statText}>Detections: {latestResult.detections?.length || 0}</div>
              <div style={styles.statText}>Poses: {latestResult.poses?.length || 0}</div>
              <div style={styles.statText}>Inference: {latestResult.inference_ms || 0}ms</div>
            </div>
          )}

          {/* Settings Button */}
          <button style={styles.settingsButton} onClick={() => setConfigMode(true)}>⚙️</button>

        </div>
      </div>
    </div>
  );
}

const styles = {
  appContainer: { display: 'flex', flexDirection: 'row', height: '100vh', backgroundColor: '#121212', fontFamily: 'sans-serif' },
  mainContent: { flex: 2, padding: '20px', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' },
  title: { fontSize: '24px', fontWeight: 'bold', color: '#ffffff', margin: '0 0 10px 0' },
  titleBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' },
  refreshButton: { fontSize: '14px', fontWeight: '600', color: '#4CAF50', backgroundColor: 'rgba(76, 175, 80, 0.15)', padding: '8px 12px', borderRadius: '6px', border: '1px solid #4CAF50', cursor: 'pointer' },
  loadingView: { flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212', height: '100vh', color: '#888' },
  
  eventsList: { flex: 1, marginTop: '10px', overflowY: 'auto' },
  eventCard: { backgroundColor: '#1e1e1e', borderRadius: '8px', padding: '12px', marginBottom: '10px', borderLeft: '4px solid #FF6600' },
  eventHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' },
  eventType: { color: '#00FF00', fontWeight: 'bold', fontSize: '14px', margin: 0 },
  eventTime: { color: '#888888', fontSize: '10px', fontStyle: 'italic', margin: 0 },
  
  cameraSidebar: { flex: 1, backgroundColor: '#000000', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '10px' },
  cameraWrapper: { width: '100%', aspectRatio: '4 / 3', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#1e1e1e', position: 'relative' },
  
  camera: { width: '100%', height: '100%', objectFit: 'fill', display: 'block' },

  status: { position: 'absolute', top: '10px', left: '10px', color: 'white', fontWeight: 'bold', fontSize: '12px', padding: '6px', borderRadius: '4px', zIndex: 10 },
  warningText: { position: 'absolute', top: '100px', left: '50%', transform: 'translateX(-50%)', color: 'red', fontSize: '16px', fontWeight: 'bold', backgroundColor: 'rgba(0,0,0,0.7)', padding: '8px', borderRadius: '5px', zIndex: 10, whiteSpace: 'nowrap' },
  statsPanel: { position: 'absolute', bottom: '10px', right: '10px', backgroundColor: 'rgba(0,0,0,0.7)', padding: '10px', borderRadius: '8px', zIndex: 10 },
  statText: { color: 'white', fontSize: '10px', margin: '2px 0' },
  boundingBox: { position: 'absolute', border: '2px solid lime', backgroundColor: 'rgba(50, 205, 50, 0.15)', pointerEvents: 'none' },
  label: { position: 'absolute', top: '-20px', left: '-2px', color: 'lime', backgroundColor: 'black', padding: '0 4px', fontSize: '12px', fontWeight: 'bold', whiteSpace: 'nowrap' },
  interactionBox: { position: 'absolute', border: '2px solid', borderRadius: '3px', pointerEvents: 'none' },
  interactionLabel: { position: 'absolute', top: '-16px', left: '-2px', backgroundColor: 'black', padding: '0 3px', fontSize: '10px', fontWeight: 'bold', whiteSpace: 'nowrap' },
  settingsButton: { position: 'absolute', bottom: '10px', left: '10px', fontSize: '24px', backgroundColor: 'rgba(0,0,0,0.6)', padding: '8px', borderRadius: '25px', cursor: 'pointer', zIndex: 10, border: 'none', color: 'white' },

  configContainer: { flex: 1, backgroundColor: '#121212', padding: '40px', height: '100vh', boxSizing: 'border-box' },
  configForm: { padding: '20px', backgroundColor: '#1e1e1e', borderRadius: '8px', maxWidth: '400px', margin: '0 auto' },
  configTitle: { fontSize: '22px', fontWeight: 'bold', marginBottom: '20px', color: 'white', margin: '0 0 20px 0' },
  configLabel: { fontSize: '14px', fontWeight: '600', marginTop: '15px', marginBottom: '5px', color: '#ccc', display: 'block' },
  input: { width: '100%', boxSizing: 'border-box', border: '1px solid #444', padding: '10px', borderRadius: '5px', backgroundColor: '#333', marginBottom: '10px', color: 'white' },
  buttonContainer: { margin: '8px 0' },
  buttonSave: { width: '100%', padding: '10px', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', backgroundColor: '#4CAF50', color: 'white' },
  buttonCancel: { width: '100%', padding: '10px', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', backgroundColor: '#999', color: 'white' }
};