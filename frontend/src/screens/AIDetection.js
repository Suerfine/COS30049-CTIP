import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, Alert, TextInput, ScrollView, Button } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useInference } from '../hooks/useInference';

export default function DetectionScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);
  const isCapturing = useRef(false);

  // Configuration state
  const [serverConfig, setServerConfig] = useState({
    host: '172.17.104.136', // Replace with your PC's IP
    port: '8000',
    userId: '1',
  });
  const [configMode, setConfigMode] = useState(false);
  const [tempConfig, setTempConfig] = useState(serverConfig);

  // Construct WebSocket URL
  const ws_url = `ws://${serverConfig.host}:${serverConfig.port}/ws/detect?user_id=${serverConfig.userId}`;
  const { latestResult, isConnected, sendFrame } = useInference(ws_url);

  // Screen dimensions for scaling the bounding boxes
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  
  // The server evaluates frames at a specific size (e.g., 640px). 
  // You must calculate the scale factor between the server's image size and the phone's screen size.
  const SCALE_X = screenWidth / 640; 
  const SCALE_Y = screenHeight / 480;

  useEffect(() => {
    const captureInterval = setInterval(async () => {
      if (!cameraRef.current || !isConnected || isCapturing.current) return;

      isCapturing.current = true;
      try {
        // Capture a low-resolution JPEG to keep payload small
        const photo = await cameraRef.current.takePictureAsync({ quality: 0.3, base64: false });
        
        // Convert the local file URI to a binary Blob expected by FastAPI
        const response = await fetch(photo.uri);
        const blob = await response.blob();
        
        sendFrame(blob);
      } catch (error) {
        console.log("Capture error:", error);
      } finally {
        isCapturing.current = false;
      }
    }, 250); // ~4 frames per second

    return () => clearInterval(captureInterval);
  }, [isConnected]);

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
            To find your PC's IP: Open PowerShell and run `ipconfig`. Look for "IPv4 Address" on your WiFi adapter.
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
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} facing="back">
        
        {/* Status Indicator */}
        <Text style={styles.status}>
          {isConnected ? "🟢 Connected to ParkGuard AI" : "🔴 Connecting..."}
        </Text>

        {/* Server Config Indicator */}
        <Text style={styles.configIndicator}>
          Server: {serverConfig.host}:{serverConfig.port}
        </Text>

        {/* Detections Overlay */}
        {latestResult?.detections?.map((det, index) => {
          const [x1, y1, x2, y2] = det.bbox; 
          return (
            <View key={index} style={[styles.boundingBox, {
              left: x1 * SCALE_X, 
              top: y1 * SCALE_Y, 
              width: (x2 - x1) * SCALE_X, 
              height: (y2 - y1) * SCALE_Y
            }]}>
              <Text style={styles.label}>
                {det.class_name} {Math.round(det.confidence * 100)}%
              </Text>
            </View>
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
            {latestResult.compliance && (
              <>
                <Text style={styles.statText}>Plucks: {latestResult.compliance.pluck_event_count || 0}</Text>
                <Text style={styles.statText}>Strikes: {latestResult.compliance.strike_event_count || 0}</Text>
              </>
            )}
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
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  camera: { flex: 1, position: 'relative' },
  configContainer: { flex: 1, backgroundColor: '#f5f5f5' },
  configForm: { padding: 20, marginTop: 40 },
  configTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', marginTop: 15, marginBottom: 5 },
  input: { 
    borderWidth: 1, 
    borderColor: '#ddd', 
    padding: 10, 
    borderRadius: 5,
    backgroundColor: 'white',
    marginBottom: 10,
  },
  hint: { 
    fontSize: 12, 
    color: '#666', 
    marginTop: 20, 
    marginBottom: 20,
    fontStyle: 'italic',
  },
  buttonContainer: { marginVertical: 8 },
  status: { position: 'absolute', top: 60, left: 20, color: 'white', fontWeight: 'bold', fontSize: 14, backgroundColor: 'rgba(0,0,0,0.5)', padding: 8, borderRadius: 4 },
  configIndicator: { position: 'absolute', top: 110, left: 20, color: 'white', fontSize: 12, backgroundColor: 'rgba(0,0,0,0.5)', padding: 5, borderRadius: 3 },
  warningText: { 
    position: 'absolute', top: 160, alignSelf: 'center', 
    color: 'red', fontSize: 20, fontWeight: 'bold', backgroundColor: 'rgba(0,0,0,0.7)', padding: 8, borderRadius: 5
  },
  statsPanel: { 
    position: 'absolute', 
    bottom: 20, 
    right: 20, 
    backgroundColor: 'rgba(0,0,0,0.7)', 
    padding: 12, 
    borderRadius: 8,
    minWidth: 130,
  },
  statText: { 
    color: 'white', 
    fontSize: 11, 
    marginVertical: 2,
  },
  settingsButton: { 
    position: 'absolute', 
    bottom: 30, 
    left: 20, 
    fontSize: 28, 
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 10,
    borderRadius: 25,
    overflow: 'hidden',
  },
  boundingBox: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: 'lime',
    backgroundColor: 'rgba(50, 205, 50, 0.15)',
  }
});
