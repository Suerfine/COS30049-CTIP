import React, { useRef, useEffect, useMemo, useState } from 'react';
import { CircleMarker, MapContainer, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

import apiClient from '../config/apiConfig';
import { DetectionService } from '../services/DetectionService';
import { userDashboardService } from '../services/userDashboardService';

const SERVER_CONFIG_STORAGE_KEY = 'aiDetectionServerConfig';

const getAutoHost = () => {
  if (typeof window !== 'undefined' && window.location?.hostname) {
    return window.location.hostname;
  }
  return 'localhost';
};

const getInitialServerConfig = () => {
  const fallbackConfig = { host: getAutoHost(), port: '8000' };
  if (typeof window === 'undefined') return fallbackConfig;

  try {
    const savedConfig = window.localStorage.getItem(SERVER_CONFIG_STORAGE_KEY);
    if (!savedConfig) return fallbackConfig;

    const parsed = JSON.parse(savedConfig);
    return {
      host: parsed?.host || fallbackConfig.host,
      port: parsed?.port || fallbackConfig.port
    };
  } catch {
    return fallbackConfig;
  }
};

const SKELETON_EDGES = [
  [0, 1], [0, 2], [1, 3], [2, 4],
  [5, 6], [5, 7], [7, 9], [6, 8], [8, 10],
  [5, 11], [6, 12], [11, 12],
  [11, 13], [13, 15], [12, 14], [14, 16],
];

const EVENT_LABELS = {
  touch_plant: 'Touch Plant',
  touch_animal: 'Touch Animal',
  plucking_plant: 'Plucking Plant',
  animal_strike: 'Animal Strike',
  extended_touch_animal: 'Extended Touch Animal',
  extended_touch_plant: 'Extended Touch Plant',
};

const MIRROR_PREVIEW = true;
const MIRROR_ANNOTATED_FRAME = true;

export default function DetectionScreenWeb() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const cameraWrapperRef = useRef(null);
  const isCapturing = useRef(false);
  const lastLogTime = useRef(0);

  const [permissionGranted, setPermissionGranted] = useState(false);
  const [cameraStatus, setCameraStatus] = useState('starting');
  const [cameraError, setCameraError] = useState('');
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
  
  // Safe scaling based on intrinsic video resolution vs rendered UI size
  const SCALE_X = cameraLayout ? cameraLayout.width / cameraLayout.videoWidth : 1;
  const SCALE_Y = cameraLayout ? cameraLayout.height / cameraLayout.videoHeight : 1;

  const saveServerConfig = (config) => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(SERVER_CONFIG_STORAGE_KEY, JSON.stringify(config));
    } catch {
      // Ignore storage failures and keep runtime config.
    }
  };

  const setVideoElement = (node) => {
    videoRef.current = node;

    // Reattach active stream after UI remounts (e.g. opening/closing config mode).
    if (node && streamRef.current && node.srcObject !== streamRef.current) {
      node.srcObject = streamRef.current;
    }
  };

  const startCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraStatus('blocked');
      setCameraError('Camera access is not available in this browser.');
      setPermissionGranted(false);
      return;
    }

    setCameraStatus('starting');
    setCameraError('');

    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } }
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setPermissionGranted(true);
      setCameraStatus('ready');
    } catch (err) {
      console.error("Camera access denied:", err);
      setPermissionGranted(false);
      setCameraStatus('blocked');
      setCameraError(err?.message || 'Camera permission was blocked.');
    }
  };

  // 1. Start Native Web Camera
  useEffect(() => {
    startCamera();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
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
        setCurrentUser({ id: 260001, username: 'default_user' });
      } finally {
        setUserLoading(false);
      }
    };
    fetchCurrentUser();
  }, []);

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
      const activeResponse = await apiClient.get(`/anomaly-events/${currentUser.id}?includeResolved=false`);
      setAnomalyEvents(extractEvents(activeResponse.data));
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

  const getEventLabel = (eventType) => EVENT_LABELS[eventType] || eventType || 'Unknown';

  const getEventConfidence = (event) => {
    const raw = event?.metadata?.detection_confidence ?? event?.metadata?.confidence;
    const confidence = Number(raw);
    if (!Number.isFinite(confidence)) return 'N/A';
    return `${Math.round(confidence * 100)}%`;
  };

  const captureAnnotatedFrame = (result) => {
    if (!videoRef.current || !canvasRef.current || !result) return null;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video.videoWidth === 0) return null;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');

    if (MIRROR_ANNOTATED_FRAME) {
      ctx.save();
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      ctx.restore();
    } else {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    }

    ctx.lineWidth = 2;
    ctx.font = '14px sans-serif';

    (result.detections || []).forEach((det) => {
      const [x1, y1, x2, y2] = det.bbox;
      const drawX = MIRROR_ANNOTATED_FRAME ? canvas.width - x2 : x1;
      const boxWidth = x2 - x1;
      ctx.strokeStyle = '#22c55e';
      ctx.fillStyle = 'rgba(34, 197, 94, 0.2)';
      ctx.strokeRect(drawX, y1, boxWidth, y2 - y1);
      ctx.fillRect(drawX, y1, boxWidth, y2 - y1);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`${det.class_name} ${Math.round(det.confidence * 100)}%`, drawX + 4, Math.max(16, y1 - 8));
    });

    const handBoxes = result?.compliance?.hand_boxes || [];
    handBoxes.forEach((box) => {
      const isTouching = result?.compliance?.touch_plant || result?.compliance?.touch_animal;
      const [x1, y1, x2, y2] = box;
      const drawX = MIRROR_ANNOTATED_FRAME ? canvas.width - x2 : x1;
      ctx.strokeStyle = isTouching ? '#f97316' : '#facc15';
      ctx.strokeRect(drawX, y1, x2 - x1, y2 - y1);
    });

    const dataUrl = canvas.toDataURL('image/jpeg', 0.5);
    return dataUrl.split(',')[1];
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
        'Failed to resolve anomaly event.';
      window.alert(message);
    } finally {
      setResolvingEventId(null);
    }
  };

  // 4. Capture Loop
  useEffect(() => {
    const captureInterval = setInterval(async () => {
      if (!permissionGranted || !videoRef.current || isCapturing.current || !isConnected) return;

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
          const confidenceCandidates = (latestResult?.detections || []).map((d) => Number(d.confidence)).filter(Number.isFinite);
          const maxConfidence = confidenceCandidates.length ? Math.max(...confidenceCandidates) : null;
          const annotatedFrame = captureAnnotatedFrame(latestResult);
          
          const payload = {
            user_id: currentUser.id,
            event_type: detectedEventType,
            latitude: 1.5533,      
            longitude: 110.3592,   
            metadata: {
              source: 'web_ai_detection',
              timestamp: new Date().toISOString(),
              detection_confidence: maxConfidence,
              detections: latestResult?.detections?.length || 0,
              poses: latestResult?.poses?.length || 0,
              inference_ms: latestResult?.inference_ms || 0,
            },
            annotated_frame_base64: annotatedFrame,
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
    const baseX1 = kp1.x * SCALE_X;
    const baseX2 = kp2.x * SCALE_X;
    const x1 = MIRROR_PREVIEW && cameraLayout ? cameraLayout.width - baseX1 : baseX1;
    const x2 = MIRROR_PREVIEW && cameraLayout ? cameraLayout.width - baseX2 : baseX2;
    const y1 = kp1.y * SCALE_Y;
    const y2 = kp2.y * SCALE_Y;
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
    const baseX = kp.x * SCALE_X;
    const x = MIRROR_PREVIEW && cameraLayout ? cameraLayout.width - baseX : baseX;
    const y = kp.y * SCALE_Y;
    const KP_RADIUS = 5;

    return (
      <div key={`kp-${index}`} style={{
        position: 'absolute', left: x - KP_RADIUS, top: y - KP_RADIUS, width: KP_RADIUS * 2, height: KP_RADIUS * 2,
        borderRadius: KP_RADIUS, backgroundColor: '#00FFFF', border: '1px solid #FFFFFF', opacity: 0.8,
      }} />
    );
  };

  const selectedEventCenter = useMemo(() => {
    if (!selectedEvent?.latitude || !selectedEvent?.longitude) return [1.5533, 110.3592];
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
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* LEFT PANEL: Anomaly Event Log */}
      <div style={styles.mainContent}>
        <div style={styles.titleBar}>
          <div>
            <h1 style={styles.title}>AI Detection Dashboard</h1>
            <span style={styles.pageSubtitle}>Monitor and review active anomaly alerts</span>
          </div>
          <button style={styles.refreshButton} onClick={fetchAnomalyEvents}>Refresh</button>
        </div>
        
        {userLoading ? (
          <span style={{ color: '#888', marginTop: 20 }}>Loading user...</span>
        ) : eventsLoading ? (
          <span style={{ color: '#888', marginTop: 20 }}>Loading events...</span>
        ) : (
          <div style={styles.eventsSingleColumn}>
            <div style={styles.eventsPanel}>
              <div style={styles.panelHeader}>
                <h2 style={styles.panelTitle}>Active Anomalies</h2>
                <span style={styles.badgeCount}>{anomalyEvents.length}</span>
              </div>
              <div style={styles.eventsList}>
                {anomalyEvents.length === 0 ? (
                  <span style={styles.emptyText}>No active anomalies</span>
                ) : anomalyEvents.map((event) => (
                  <button key={event.id} style={styles.eventCardButton} onClick={() => setSelectedEvent(event)}>
                    <div style={styles.eventCard}>
                      <div style={styles.eventHeader}>
                        <span style={styles.eventType}>{getEventLabel(event.event_type)}</span>
                        <span style={styles.eventConfidence}>{getEventConfidence(event)}</span>
                      </div>
                      <div style={styles.eventMetaRow}>
                        <span style={styles.eventTime}>{new Date(event.created_at).toLocaleString()}</span>
                        <span style={styles.activePill}>Active</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* RIGHT PANEL: Fixed Aspect Ratio Web Camera */}
      <div style={styles.cameraSidebar}>
        <div ref={cameraWrapperRef} style={styles.cameraWrapper}>

          <video
            ref={setVideoElement}
            autoPlay
            playsInline
            muted
            onLoadedMetadata={updateLayout}
            style={{ ...styles.camera, transform: MIRROR_PREVIEW ? 'scaleX(-1)' : 'none' }}
          />

          {!permissionGranted && (
            <div style={styles.cameraPlaceholder}>
              <div style={styles.cameraPlaceholderTitle}>
                {cameraStatus === 'starting' ? 'Starting camera...' : 'Camera unavailable'}
              </div>
              <div style={styles.cameraPlaceholderText}>
                {cameraStatus === 'starting'
                  ? 'Allow camera access in your browser to start live anomaly detection.'
                  : cameraError || 'Allow camera access in your browser, then try again.'}
              </div>
              {cameraStatus === 'blocked' && (
                <button style={styles.retryButton} onClick={startCamera}>
                  Retry Camera
                </button>
              )}
            </div>
          )}
            
          <span style={{...styles.status, backgroundColor: isConnected ? 'rgba(16, 185, 129, 0.85)' : 'rgba(220, 38, 38, 0.85)'}}>
            {isConnected ? "Connected (AI API)" : "AI Server Disconnected"}
          </span>

          {/* Detections Overlay */}
          {isConnected && cameraLayout && latestResult?.detections?.map((det, index) => {
            const [x1, y1, x2, y2] = det.bbox;
            const left = MIRROR_PREVIEW ? cameraLayout.width - (x2 * SCALE_X) : x1 * SCALE_X;
            return (
              <div key={`det-${index}`} style={{...styles.boundingBox, left, top: y1 * SCALE_Y, width: (x2 - x1) * SCALE_X, height: (y2 - y1) * SCALE_Y }}>
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
            const left = MIRROR_PREVIEW ? cameraLayout.width - (box[2] * SCALE_X) : box[0] * SCALE_X;
            return (
              <div key={`hand-${index}`} style={{...styles.interactionBox,
                  left, top: box[1] * SCALE_Y, width: (box[2] - box[0]) * SCALE_X, height: (box[3] - box[1]) * SCALE_Y,
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
          {latestResult?.compliance?.extended_touch_animal && <div style={{...styles.warningText, backgroundColor: 'rgba(255, 165, 0, 0.8)'}}>EXTENDED ANIMAL TOUCH</div>}
          {latestResult?.compliance?.extended_touch_plant && <div style={{...styles.warningText, backgroundColor: 'rgba(255, 165, 0, 0.8)'}}>EXTENDED PLANT TOUCH</div>}

          {/* Live Stats Panel */}
          {isConnected && latestResult && (
            <div style={styles.statsPanel}>
              <div style={styles.statText}>Detections: {latestResult.detections?.length || 0}</div>
              <div style={styles.statText}>Poses: {latestResult.poses?.length || 0}</div>
              <div style={styles.statText}>Inference: {latestResult.inference_ms || 0}ms</div>
            </div>
          )}

          {/* Settings Button */}
          <button style={styles.settingsButton} onClick={() => setConfigMode(true)}>⚙</button>
        </div>
      </div>

      {selectedEvent && (
        <div style={styles.detailModalOverlay} onClick={() => setSelectedEvent(null)}>
          <div style={styles.detailModal} onClick={(event) => event.stopPropagation()}>
            <div style={styles.detailHeader}>
              <h3 style={styles.detailTitle}>{getEventLabel(selectedEvent.event_type)}</h3>
              <button style={styles.detailClose} onClick={() => setSelectedEvent(null)}>Close</button>
            </div>
            <div style={styles.detailMetaGrid}>
              <div><strong>Detected:</strong> {new Date(selectedEvent.created_at).toLocaleString()}</div>
              <div><strong>Confidence:</strong> {getEventConfidence(selectedEvent)}</div>
              <div><strong>Latitude:</strong> {selectedEvent.latitude ?? 'N/A'}</div>
              <div><strong>Longitude:</strong> {selectedEvent.longitude ?? 'N/A'}</div>
            </div>
            {selectedEvent.annotated_frame_base64 ? (
              <img
                alt="Annotated anomaly evidence"
                src={`data:image/jpeg;base64,${selectedEvent.annotated_frame_base64}`}
                style={styles.detailImage}
              />
            ) : (
              <div style={styles.emptyEvidence}>No annotated frame recorded for this event.</div>
            )}
            <div style={styles.detailMapShell}>
              <MapContainer key={`event-map-${selectedEvent.id}`} center={selectedEventCenter} zoom={15} scrollWheelZoom style={styles.mapCanvas}>
                <ModalMapResizer />
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {selectedEvent?.latitude && selectedEvent?.longitude ? (
                  <CircleMarker
                    center={[Number(selectedEvent.latitude), Number(selectedEvent.longitude)]}
                    radius={9}
                    pathOptions={{ color: '#dc2626', fillColor: '#ef4444', fillOpacity: 0.8 }}
                  />
                ) : null}
              </MapContainer>
            </div>
            <pre style={styles.metadataBlock}>{JSON.stringify(selectedEvent.metadata || {}, null, 2)}</pre>
            {!selectedEvent.is_resolved && (
              <button
                style={styles.resolveButton}
                onClick={() => resolveEvent(selectedEvent.id)}
                disabled={resolvingEventId === selectedEvent.id}
              >
                {resolvingEventId === selectedEvent.id ? 'Resolving...' : 'Mark as Resolved'}
              </button>
            )}
          </div>
        </div>
      )}

      {configMode && (
        <div style={styles.configModalOverlay}>
          <div style={styles.configForm}>
            <h2 style={styles.configTitle}>AI Server Configuration</h2>
            <span style={styles.configLabel}>Server Host (IP Address)</span>
            <input
              style={styles.input}
              placeholder={getAutoHost()}
              value={tempConfig.host}
              onChange={(e) => setTempConfig({ ...tempConfig, host: e.target.value })}
            />
            <span style={styles.configLabel}>Server Port</span>
            <input
              style={styles.input}
              placeholder="8000"
              type="number"
              value={tempConfig.port}
              onChange={(e) => setTempConfig({ ...tempConfig, port: e.target.value })}
            />
            <div style={styles.buttonContainer}>
              <button
                style={styles.buttonSave}
                onClick={() => {
                  const nextConfig = {
                    host: (tempConfig.host || '').trim() || getAutoHost(),
                    port: (tempConfig.port || '').trim() || '8000'
                  };
                  setServerConfig(nextConfig);
                  setConfigMode(false);
                }}
              >
                Save
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
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  appContainer: { display: 'flex', flexDirection: 'row', height: '100vh', backgroundColor: '#f6f8f7', fontFamily: 'Inter, sans-serif', color: '#111827' },
  mainContent: { flex: 2, padding: '24px', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' },
  title: { fontSize: '28px', fontWeight: '700', color: '#111827', margin: 0 },
  pageSubtitle: { marginTop: 6, color: '#6b7280', fontSize: 13 },
  titleBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', gap: 16 },
  refreshButton: { fontSize: '14px', fontWeight: '600', color: '#0a6340', backgroundColor: '#ecfdf5', padding: '10px 14px', borderRadius: '8px', border: '1px solid #bbf7d0', cursor: 'pointer' },
  eventsSingleColumn: { display: 'flex', flexDirection: 'column', gap: 16, flex: 1, minHeight: 0 },
  eventsPanel: { backgroundColor: '#ffffff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 12, display: 'flex', flexDirection: 'column', minHeight: 0 },
  panelHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  panelTitle: { margin: 0, fontSize: 16, color: '#111827' },
  badgeCount: { fontSize: 12, fontWeight: '700', color: '#374151', backgroundColor: '#f3f4f6', borderRadius: 99, padding: '4px 8px' },
  eventsList: { flex: 1, overflowY: 'auto', paddingRight: 4 },
  eventCardButton: { border: 'none', backgroundColor: 'transparent', textAlign: 'left', padding: 0, cursor: 'pointer', marginBottom: 10 },
  eventCard: { backgroundColor: '#f9fafb', borderRadius: '10px', padding: '12px', border: '1px solid #e5e7eb' },
  eventHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', gap: 8 },
  eventMetaRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  eventType: { color: '#111827', fontWeight: '700', fontSize: '13px', margin: 0 },
  eventTime: { color: '#6b7280', fontSize: '11px', fontStyle: 'italic', margin: 0 },
  eventConfidence: { color: '#0f766e', fontWeight: '700', fontSize: 12 },
  activePill: { backgroundColor: '#dcfce7', color: '#166534', borderRadius: 999, fontSize: 11, padding: '2px 7px', fontWeight: '700' },
  emptyText: { color: '#9ca3af', fontSize: 13, marginTop: 8, display: 'block' },
  cameraSidebar: { flex: 1, padding: '24px 24px 24px 0', boxSizing: 'border-box' },
  cameraWrapper: { width: '100%', aspectRatio: '4 / 3', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#111827', position: 'relative', border: '1px solid #d1d5db' },
  camera: { width: '100%', height: '100%', objectFit: 'fill', display: 'block' },
  cameraPlaceholder: { position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '24px', textAlign: 'center', backgroundColor: '#1f2937', color: 'white', zIndex: 5 },
  cameraPlaceholderTitle: { fontSize: '18px', fontWeight: '700' },
  cameraPlaceholderText: { maxWidth: '320px', color: '#d1d5db', fontSize: '13px', lineHeight: 1.4 },
  retryButton: { border: '1px solid #34d399', borderRadius: '8px', backgroundColor: 'rgba(52, 211, 153, 0.15)', color: '#a7f3d0', cursor: 'pointer', fontWeight: '700', padding: '8px 12px' },
  status: { position: 'absolute', top: '10px', left: '10px', color: 'white', fontWeight: '700', fontSize: '12px', padding: '7px 9px', borderRadius: '7px', zIndex: 10 },
  warningText: { position: 'absolute', top: '100px', left: '50%', transform: 'translateX(-50%)', color: '#fee2e2', fontSize: '14px', fontWeight: '700', backgroundColor: 'rgba(127, 29, 29, 0.85)', padding: '8px 10px', borderRadius: '8px', zIndex: 10, whiteSpace: 'nowrap' },
  statsPanel: { position: 'absolute', bottom: '10px', right: '10px', backgroundColor: 'rgba(17,24,39,0.8)', padding: '10px', borderRadius: '10px', zIndex: 10 },
  statText: { color: '#e5e7eb', fontSize: '11px', margin: '2px 0' },
  boundingBox: { position: 'absolute', border: '2px solid #22c55e', backgroundColor: 'rgba(34, 197, 94, 0.2)', pointerEvents: 'none' },
  label: { position: 'absolute', top: '-20px', left: '-2px', color: '#dcfce7', backgroundColor: 'rgba(15,23,42,0.85)', padding: '0 4px', fontSize: '12px', fontWeight: '700', whiteSpace: 'nowrap' },
  interactionBox: { position: 'absolute', border: '2px solid', borderRadius: '3px', pointerEvents: 'none' },
  interactionLabel: { position: 'absolute', top: '-16px', left: '-2px', backgroundColor: '#111827', padding: '0 3px', fontSize: '10px', fontWeight: '700', whiteSpace: 'nowrap' },
  settingsButton: { position: 'absolute', bottom: '10px', left: '10px', fontSize: '22px', backgroundColor: 'rgba(255,255,255,0.2)', padding: '8px', borderRadius: '20px', cursor: 'pointer', zIndex: 10, border: 'none', color: 'white' },
  detailModalOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', zIndex: 1200, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 16 },
  detailModal: { width: 'min(900px, 96vw)', maxHeight: '90vh', overflowY: 'auto', backgroundColor: 'white', borderRadius: 12, padding: 16, border: '1px solid #e5e7eb' },
  detailHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  detailTitle: { margin: 0, fontSize: 18, color: '#111827' },
  detailClose: { border: '1px solid #d1d5db', backgroundColor: '#f9fafb', borderRadius: 8, padding: '8px 12px', cursor: 'pointer' },
  detailMetaGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12, color: '#374151', fontSize: 13 },
  detailImage: { width: '100%', maxHeight: 280, objectFit: 'contain', borderRadius: 10, border: '1px solid #e5e7eb', marginBottom: 12, backgroundColor: '#111827' },
  emptyEvidence: { padding: 10, border: '1px dashed #d1d5db', borderRadius: 8, color: '#6b7280', marginBottom: 12 },
  detailMapShell: { height: 220, borderRadius: 10, overflow: 'hidden', border: '1px solid #e5e7eb', marginBottom: 12 },
  mapCanvas: { width: '100%', height: '100%' },
  metadataBlock: { backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: 10, maxHeight: 180, overflow: 'auto', fontSize: 12, color: '#374151' },
  resolveButton: { marginTop: 12, backgroundColor: '#065f46', color: 'white', border: 'none', borderRadius: 8, padding: '10px 12px', fontWeight: '700', cursor: 'pointer' },
  configModalOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.65)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '16px', boxSizing: 'border-box' },
  configForm: { padding: '20px', backgroundColor: '#ffffff', borderRadius: '12px', maxWidth: '420px', width: '100%', margin: '0 auto', border: '1px solid #e5e7eb' },
  configTitle: { fontSize: '22px', fontWeight: '700', color: '#111827', margin: '0 0 20px 0' },
  configLabel: { fontSize: '14px', fontWeight: '600', marginTop: '15px', marginBottom: '5px', color: '#374151', display: 'block' },
  input: { width: '100%', boxSizing: 'border-box', border: '1px solid #d1d5db', padding: '10px', borderRadius: '8px', backgroundColor: '#f9fafb', marginBottom: '10px', color: '#111827' },
  buttonContainer: { margin: '8px 0' },
  buttonSave: { width: '100%', padding: '10px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', backgroundColor: '#0a6340', color: 'white' },
  buttonCancel: { width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', backgroundColor: '#f3f4f6', color: '#111827' },
};
