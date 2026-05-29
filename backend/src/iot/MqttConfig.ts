/**
 * MQTT Configuration
 * Configure your MQTT broker settings here
 */

export const mqttConfig = {
  // MQTT Broker URL
  // Examples:
  // - Local broker: 'mqtt://localhost:1883'
  // - Cloud broker: 'mqtt://broker.hivemq.com:1883'
  // - Secure broker: 'mqtts://your-broker.com:8883'
  brokerUrl: process.env.MQTT_BROKER_URL || 'ws://broker.hivemq.com:8000/mqtt',

  // Topics to subscribe to
  // Examples:
  // - Single topic: ['sensors/#']
  // - Multiple topics: ['sensors/#', 'esp32/#', 'iot/temperature/#']
  topics: process.env.MQTT_TOPICS ? process.env.MQTT_TOPICS.split(',') : ['forest/zone1/sensorlog'],

  // Connection options
  options: {
    clientId: `backend_${Date.now()}`,
    clean: true,
    connectTimeout: 4000,
    reconnectPeriod: 1000,
    // Add authentication if needed:
    // username: process.env.MQTT_USERNAME,
    // password: process.env.MQTT_PASSWORD,
  },

  // Quality of Service (0, 1, or 2)
  qos: 1,
};