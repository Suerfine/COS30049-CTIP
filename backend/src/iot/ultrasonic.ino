#include <WiFi.h>
#include <PubSubClient.h>
#include <time.h>

// --- TIME ---
const char* ntpServer = "pool.ntp.org";
const long  gmtOffset_sec = 28800; // For Malaysia (UTC+8): 8 * 3600
const int   daylightOffset_sec = 0; // No daylight savings in Malaysia

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

  // Sync time from NTP server
  configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);
  Serial.println("Waiting for NTP time sync...");
  
  // Wait a few seconds for time to sync
  struct tm timeinfo;
  if(!getLocalTime(&timeinfo)){
    Serial.println("Failed to obtain time");
  } else {
    Serial.println("Time synced!");
  }
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
  // Get current time
  struct tm timeinfo;
  char timeString[20];
  if(!getLocalTime(&timeinfo)){
    sprintf(timeString, "0000-00-00 00:00:00");
  } else {
    strftime(timeString, sizeof(timeString), "%Y-%m-%d %H:%M:%S", &timeinfo);
  }
  
  String payload = "{";
  payload += "\"sensor_id\":" + String(sensor_id) + ",";
  payload += "\"status\":\"" + status + "\",";
  payload += "\"data\":" + dataJson + ",";      
  payload += "\"created_at\":\"" + String(timeString) + "\""; 
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
  Serial.println("Dist: " + String(dist));
}

void loop() {
  reconnectWiFi();
  reconnectMQTT();
  client.loop();
  processSensors();
  processQueue();
  delay(1000);
}