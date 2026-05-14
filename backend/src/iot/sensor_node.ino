#include <WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>
#include <time.h>

#define DEVICE_CONNECTED false

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
#define PIN_MQ2 33
#define PIN_TEMP 27
#define PIN_ACOUSTIC 35
#define PIN_MICROWAVE 25
#define PIN_BUZZER 32
#define PIN_LED 2

// --- OFFLINE QUEUE ---
#define MAX_QUEUE 50

String messageQueue[MAX_QUEUE];
int queueStart = 0;
int queueEnd = 0;

DHT dht(PIN_TEMP, DHT11);

// --- Individual Timers for each sensor ---
unsigned long lastFireLog = 0;
unsigned long lastMicrowaveLog = 0;
unsigned long lastAcousticLog = 0;
unsigned long lastSmokingLog = 0;

// --- Intervals ---
const unsigned long INT_NORMAL = 1800000; // 30 mins
const unsigned long INT_ALERT  = 300000;  // 5 mins

unsigned long lastLogTime = 0;

// Sensor States
String lastFireStatus = "normal";
String lastMicroStatus = "normal";
String lastSoundStatus = "normal";
String lastSmokingStatus = "normal";

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n--- System Initializing ---");
  
  dht.begin();
  pinMode(PIN_MICROWAVE, INPUT_PULLDOWN);
  pinMode(PIN_ACOUSTIC, INPUT_PULLUP);
  pinMode(PIN_BUZZER, OUTPUT);
  pinMode(PIN_LED, OUTPUT);
  
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

  // 1. FIRE SENSOR (Temp + MQ2)
  float t = dht.readTemperature();
  if (isnan(t)) {
    Serial.println("DHT read failed");
    return;
  }

  int smoke = analogRead(PIN_MQ2);
  String currentFireStatus = (t > 50 || smoke > 1500) ? "alerting" : "normal";
  unsigned long fireInterval = (currentFireStatus == "alerting") ? INT_ALERT : INT_NORMAL;

  if (currentFireStatus == "alerting") {
    digitalWrite(PIN_LED, HIGH);
  } else {
    digitalWrite(PIN_LED, LOW);
  }
  
  if (currentFireStatus != lastFireStatus || (now - lastFireLog >= fireInterval)) {
    String fireData = "{";
    fireData += "\"temperature\":" + String(t) + ",";
    fireData += "\"smoke\":" + String(smoke);
    fireData += "}";
    
    sendLog(1, currentFireStatus, fireData);
    
    lastFireLog = now;
    lastFireStatus = currentFireStatus;
  }

  // 2. SMOKING SENSOR
  String currentSmokingStatus = (smoke > 800 && smoke <= 2500 && t <= 50) ? "alerting" : "normal";
  unsigned long smokeInterval = (currentSmokingStatus == "alerting") ? INT_ALERT : INT_NORMAL;

  if (currentSmokingStatus != lastSmokingStatus || (now - lastSmokingLog >= smokeInterval)) {
    String smokeData = "{";
    smokeData += "\"smoke_level\":" + String(smoke) + ",";
    smokeData += "\"context\":\"possible_smoking\"";
    smokeData += "}";
    
    sendLog(5, currentSmokingStatus, smokeData); 
    
    lastSmokingLog = now;
    lastSmokingStatus = currentSmokingStatus;
  }

  // 3. MICROWAVE SENSOR
  bool motion = digitalRead(PIN_MICROWAVE);
  String currentMicroStatus = motion ? "alerting" : "normal";
  unsigned long microInterval = (currentMicroStatus == "alerting") ? INT_ALERT : INT_NORMAL;

  if (currentMicroStatus != lastMicroStatus || (now - lastMicrowaveLog >= microInterval)) {
    String motionData = "{";
    motionData += "\"motion\":" + String(motion ? "true" : "false");
    motionData += "}";
    
    sendLog(2, currentMicroStatus, motionData);
    
    lastMicrowaveLog = now;
    lastMicroStatus = currentMicroStatus;
  }

  // 4. ACOUSTIC SENSOR
  bool soundDetected = digitalRead(PIN_ACOUSTIC) == LOW; 
  String currentSoundStatus = soundDetected ? "alerting" : "normal";
  unsigned long soundInterval = (currentSoundStatus == "alerting") ? INT_ALERT : INT_NORMAL;

  if (currentSoundStatus != lastSoundStatus || (now - lastAcousticLog >= soundInterval)) {
    String soundData = "{";
    soundData += "\"sound_detected\":" + String(soundDetected ? "true" : "false");
    soundData += "}";
    
    sendLog(3, currentSoundStatus, soundData);
    
    lastAcousticLog = now;
    lastSoundStatus = currentSoundStatus;
  }

  if (currentMicroStatus == "alerting") {
    digitalWrite(PIN_BUZZER, HIGH); // Alarm ON
  } else {
    digitalWrite(PIN_BUZZER, LOW);  // Alarm OFF
  }

  Serial.print("DEBUG: ");
  Serial.print("Temp: " + String(t));
  Serial.print(" | Smoke: " + String(smoke));
  Serial.print(" | Motion: " + String(motion));
  Serial.println(" | Sound: " + String(soundDetected ? "DETECTED" : "NORMAL"));
}

void loop() {
  reconnectWiFi();
  reconnectMQTT();
  client.loop();

  if (DEVICE_CONNECTED) {
    processSensors();
    processQueue();
  } else {
    Serial.println("Device not connected. Sensor logging disabled.");
  }

  delay(1000);
}