import * as mqtt from 'mqtt';
import { SensorLog, Sensor } from '../models';
import { SensorStatus } from '../enum/SensorStatus';
import { mqttConfig } from './MqttConfig';
import sequelize from '../config/Database';
import { sendNotification } from '../utils/sendNotification';
import { NotificationCategory } from '../enum/NotificationCategory';

interface SensorData {
  sensor_id: number;
  status: SensorStatus;
  data: Record<string, any>;
  created_at: string | number | Date;
}

class MqttService {
  private client: mqtt.MqttClient | null = null;

  constructor() {
    // Service uses config from MqttConfig.ts
  }

  /**
   * Connect to MQTT broker
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log(`Connecting to MQTT broker: ${mqttConfig.brokerUrl}`);

      this.client = mqtt.connect(mqttConfig.brokerUrl, mqttConfig.options);

      this.client.on('connect', () => {
        console.log('Connected to MQTT broker');

        // Subscribe to topics
        this.client!.subscribe(mqttConfig.topics, { qos: 1 }, (err) => {
          if (err) {
            console.error('Failed to subscribe to topics:', err);
            reject(err);
          } else {
            console.log(`Subscribed to topics: ${mqttConfig.topics.join(', ')}`);
            resolve();
          }
        });
      });

      this.client.on('error', (err) => {
        console.error('MQTT connection error:', err);
        reject(err);
      });

      // Handle incoming messages
      this.client.on('message', this.handleMessage.bind(this));
    });
  }

  /**
   * Handle incoming MQTT messages
   */
  private async handleMessage(topic: string, message: Buffer) {
    try {
      console.log(`Received message on topic: ${topic}`);
      console.log(`Message: ${message.toString()}`);

      // Parse the message (assuming JSON format)
      const payload = JSON.parse(message.toString());

      // Process the sensor data
      await this.processSensorData(topic, payload);

    } catch (error) {
      console.error('Error processing MQTT message:', error);
    }
  }

  /**
   * Process sensor data and save to database
   */
  private async processSensorData(topic: string, payload: any) {
    try {
      // Extract sensor_id from topic or payload
      // This depends on your ESP32's topic structure
      const sensorId = this.extractSensorId(topic, payload);

      if (!sensorId) {
        console.error('Could not extract sensor_id from topic or payload');
        return;
      }

      // Validate sensor exists
      const sensor = await Sensor.findByPk(sensorId);
      if (!sensor) {
        console.error(`Sensor with id ${sensorId} not found`);
        return;
      }

      // Extract status and data
      const status = payload.status || SensorStatus.NORMAL;
      const data = payload.data || payload; // Use entire payload if no data field
      let createdAt = payload.created_at ? new Date(payload.created_at) : new Date();
      if (payload.created_at && isNaN(createdAt.getTime())) {
        console.warn(`Invalid created_at timestamp received, using now: ${payload.created_at}`);
        createdAt = new Date();
      }

      const transaction = await sequelize.transaction();
      try {
        // Create sensor log entry
        const logEntry = await SensorLog.create(
          {
            sensor_id: sensorId,
            status: status as SensorStatus,
            data: data,
            created_at: createdAt,
          },
          { transaction },
        );

        // Update sensor's current status
        await sensor.update(
          { current_status: status },
          { transaction },
        );

        if (status === SensorStatus.ALERTING) {
          const title = `Sensor Alert: ${sensor.name}`;
          const message = `Sensor "${sensor.name}" (${sensor.type}) is in alerting state.`;
          const url = `/sensors/${sensor.id}`;

          await sendNotification(
            'admin',
            title,
            message,
            transaction,
            undefined,
            false,
            NotificationCategory.ANOMALY_ALERT,
            url,
          );
          await sendNotification(
            'park_guides',
            title,
            message,
            transaction,
            undefined,
            false,
            NotificationCategory.ANOMALY_ALERT,
            url,
          );
        }

        await transaction.commit();
        console.log(`Sensor log created for sensor ${sensorId}:`, logEntry.id);
      } catch (error) {
        await transaction.rollback();
        throw error;
      }

    } catch (error) {
      console.error('Error processing sensor data:', error);
    }
  }

  /**
   * Extract sensor_id from topic or payload
   * Customize this based on your ESP32's topic structure
   */
  private extractSensorId(topic: string, payload: any): number | null {
    // Check the JSON payload first, since the Arduino explicitly sends it
    if (payload && payload.sensor_id) {
        return parseInt(payload.sensor_id, 10);
    }

    // Fallback to topic search
    const topicMatch = topic.match(/(\d+)/); 
    return topicMatch ? parseInt(topicMatch[0], 10) : null;
  }

  /**
   * Disconnect from MQTT broker
   */
  disconnect(): void {
    if (this.client) {
      console.log('Disconnecting from MQTT broker');
      this.client.end();
      this.client = null;
    }
  }

  /**
   * Get connection status
   */
  isConnected(): boolean {
    return this.client?.connected || false;
  }
}

// Export singleton instance
export default new MqttService();