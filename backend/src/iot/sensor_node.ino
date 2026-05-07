#include <WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>

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
float avgSound = 1900.0;

// Sensor States
String lastFireStatus = "normal";
String lastMicroStatus = "normal";
String lastSoundStatus = "normal";
String lastSmokingStatus = "normal";

void setup() {
  Serial.begin(115200);
  dht.begin();
  pinMode(PIN_MICROWAVE, INPUT);
  pinMode(PIN_ACOUSTIC, INPUT);
  pinMode(PIN_BUZZER, OUTPUT);
  pinMode(PIN_LED, OUTPUT);
  
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) delay(500);
  client.setServer(mqtt_server, 1883);
}

// Function to format and send JSON to sensorlog
void sendLog(int sensor_id, String status, String dataJson) {
  String payload = "{";
  payload += "\"sensor_id\":" + String(sensor_id) + ",";
  payload += "\"status\":\"" + status + "\",";
  payload += "\"data\":" + dataJson;  // <-- NO QUOTES
  payload += "}";

  client.publish(TOPIC_LOG, payload.c_str());
  Serial.println("Log Sent: " + payload);
}

void processSensors() {
  unsigned long now = millis();

  // 1. FIRE SENSOR (Temp + MQ2)
  float t = dht.readTemperature();
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
    
    sendLog(1, currentSmokingStatus, smokeData); 
    
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
  if (!client.connected()) {
    Serial.println("Reconnecting MQTT...");
    if (client.connect("ESP32_Forest_Zone1")) {
      Serial.println("Connected");
    }
  }
  client.loop();
  processSensors();
  delay(10); // Check every second
}