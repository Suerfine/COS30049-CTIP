# IoT MQTT Service

This folder contains the MQTT service for handling sensor data from ESP32 devices.

## Files

- `MqttService.ts` - Main MQTT service class that handles connection, subscription, and message processing
- `MqttConfig.ts` - Configuration settings for MQTT broker and topics

## Setup

1. **Install Dependencies** (already done):
   ```bash
   npm install mqtt
   npm install --save-dev @types/mqtt
   ```

2. **Configure MQTT Broker**:
   - Update `MQTT_BROKER_URL` in your `.env` file
   - Update `MQTT_TOPICS` to match your ESP32's publishing topics

3. **ESP32 Message Format**:
   Your ESP32 should publish JSON messages. The service expects one of these formats:

   **Option 1: Topic contains sensor_id**
   ```javascript
   // Topic: sensors/1/data
   // Payload: {"temperature": 25.5, "humidity": 60}
   ```

   **Option 2: Payload contains sensor_id**
   ```javascript
   // Topic: sensors/data
   // Payload: {"sensor_id": 1, "temperature": 25.5, "humidity": 60}
   ```

   **Option 3: Full payload with status**
   ```javascript
   // Topic: sensors/1/data
   // Payload: {"status": "ACTIVE", "data": {"temperature": 25.5, "humidity": 60}}
   ```

## How it Works

1. **Connection**: Service connects to MQTT broker on server startup
2. **Subscription**: Subscribes to configured topics
3. **Message Processing**:
   - Extracts `sensor_id` from topic or payload
   - Validates sensor exists in database
   - Creates new entry in `sensor_logs` table
   - Updates sensor's `current_status`

## Configuration Options

### MQTT_BROKER_URL
- Local broker: `mqtt://localhost:1883`
- Cloud broker: `mqtt://broker.hivemq.com:1883`
- Secure broker: `mqtts://your-broker.com:8883`

### MQTT_TOPICS
- Single topic: `sensors/#`
- Multiple topics: `sensors/#,esp32/#,iot/temperature/#`

### Authentication
If your broker requires authentication, add to `.env`:
```
MQTT_USERNAME=your_username
MQTT_PASSWORD=your_password
```

## Testing

1. **Ensure backend configuration**:
   - Verify `.env` has `MQTT_BROKER_URL=mqtt://broker.hivemq.com:1883`
   - Verify `MQTT_TOPICS=forest/zone1/#` (or your topic pattern)

2. **Start the backend server**:
   ```bash
   npm run dev
   ```

3. **Test with HiveMQ WebSocket Client**:
   - Open your browser and go to: https://www.hivemq.com/demos/websocket-client/
   - Connect to the broker:
     - Host: `broker.hivemq.com`
     - Port: `8000` (WebSocket port)
     - Client ID: Leave default or enter a unique ID
     - Click "Connect"
   - Once connected, go to the "Publish" tab
   - Enter the topic: `forest/zone1/sensorlog`
   - Enter the payload: `{"sensor_id":1,"status":"normal","data":{"temperature":25.5,"smoke":500}}`
   - Click "Publish"

4. **Check backend logs**: You should see:
   ```
   Connected to MQTT broker
   Subscribed to topics: forest/zone1/#
   Received message on topic: forest/zone1/sensorlog
   Message: {"sensor_id":1,"status":"normal","data":{"temperature":25.5,"smoke":500}}
   Sensor log created for sensor 1: [log_id]
   ```

5. **Verify database**: Check that a new record was inserted into the `sensor_logs` table with the test data.

## Troubleshooting

- If no messages are received, check that the topic matches exactly (case-sensitive)
- Ensure the backend is running and connected to HiveMQ
- Use the same website to monitor subscriptions if needed
