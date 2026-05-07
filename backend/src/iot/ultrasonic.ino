#include <WiFi.h>
#include <PubSubClient.h>

// --- WIFI & MQTT ---
const char* ssid = "Elleyxx"; // Change wifi name
const char* password = "Ellie0909"; // change password
const char* mqtt_server = "broker.hivemq.com"; 

WiFiClient espClient;
PubSubClient client(espClient);

// --- TOPICS ---
#define TOPIC_LOG "forest/zone1/sensorlog"

// --- PINS ---
#define PIN_TRIG 18
#define PIN_ECHO 5

// --- OFFLINE QUEUE ---
#define MAX_QUEUE 50

String messageQueue[MAX_QUEUE];
int queueStart = 0;
int queueEnd = 0;

// --- Individual Timers for each sensor ---
unsigned long lastFloodLog = 0;

// --- Intervals ---
const unsigned long INT_NORMAL = 1800000; // 30 mins
const unsigned long INT_ALERT  = 300000;  // 5 mins

unsigned long lastLogTime = 0;

// Sensor States
String lastFloodStatus = "normal";

float getDistance() {
  digitalWrite(PIN_TRIG, LOW); 
  delayMicroseconds(2);
  digitalWrite(PIN_TRIG, HIGH); 
  delayMicroseconds(10);
  digitalWrite(PIN_TRIG, LOW);
  long duration = pulseIn(PIN_ECHO, HIGH, 20000);
  return duration * 0.034 / 2;
}

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n--- System Initializing ---");
  
  pinMode(PIN_TRIG, OUTPUT);
  pinMode(PIN_ECHO, INPUT);
  
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi...");
  
  // Try for 10 seconds, then move on
  unsigned long startWait = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - startWait < 10000) {
    delay(500);
    Serial.print(".");
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[SUCCESS] WiFi Connected!");
  } else {
    Serial.println("\n[WARNING] WiFi Not Connected. Operating in Offline Mode.");
  }
  
  client.setServer(mqtt_server, 1883);
  client.setBufferSize(1024);
}

void reconnectWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;
  Serial.println("Reconnecting WiFi...");

  WiFi.disconnect();
  WiFi.begin(ssid, password);

  unsigned long startAttempt = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - startAttempt < 10000) {
    delay(500);
    Serial.print(".");
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi Reconnected");
  } else {
    Serial.println("\nWiFi Failed");
  }
}

void reconnectMQTT() {
  if (client.connected()) return;
  
  // Use a non-blocking non-looping check instead of a while loop
  Serial.println("Reconnecting MQTT...");
  String clientId = "ESP32_" + String(random(1000, 9999));

  if (client.connect(clientId.c_str())) {
    Serial.println("MQTT Connected");
  } else {
    Serial.print("MQTT Failed, rc=");
    Serial.println(client.state());
  }
}

// Function to format and send JSON to sensorlog
void enqueueMessage(String payload) {
  int next = (queueEnd + 1) % MAX_QUEUE;

  // Prevent overflow
  if (next == queueStart) {
    Serial.println("Queue Full! Oldest message removed.");
    queueStart = (queueStart + 1) % MAX_QUEUE;
  }

  messageQueue[queueEnd] = payload;
  queueEnd = next;
}

void sendLog(int sensor_id, String status, String dataJson) {
  String payload = "{";
  payload += "\"sensor_id\":" + String(sensor_id) + ",";
  payload += "\"status\":\"" + status + "\",";
  payload += "\"data\":" + dataJson;  // <-- NO QUOTES
  payload += "}";

  // Store first
  enqueueMessage(payload);
  Serial.println("Queued: " + payload);
}

void processQueue() {
  if (!client.connected()) return;

  while (queueStart != queueEnd) {
    String payload = messageQueue[queueStart];
    bool sent = client.publish(TOPIC_LOG, payload.c_str());

    if (sent) {
      Serial.println("Synced: " + payload);
      queueStart = (queueStart + 1) % MAX_QUEUE;
    } else {
      Serial.println("Failed to send. Will retry.");
      break;
    }

    delay(100);
  }
}

void processSensors() {
  unsigned long now = millis();

  // 4. ULTRASONIC SENSOR
  // (Insert your Trigger/Echo logic here to get 'dist')
  int dist = getDistance(); 
  String currentFloodStatus = (dist > 0 && dist < 15) ? "alerting" : "normal";
  unsigned long floodInterval = (currentFloodStatus == "alerting") ? INT_ALERT : INT_NORMAL;

  if (currentFloodStatus != lastFloodStatus || (now - lastFloodLog >= floodInterval)) {
    String floodData = "{";
    floodData += "\"distance\":" + String(dist);
    floodData += "}";
    
    sendLog(4, currentFloodStatus, floodData);
    
    lastFloodLog = now;
    lastFloodStatus = currentFloodStatus;
  }

  Serial.print("DEBUG: ");
  Serial.println(" | Dist: " + String(dist));
}

void loop() {
  reconnectWiFi();
  reconnectMQTT();
  client.loop();
  processSensors();
  processQueue();
  delay(1000);
}