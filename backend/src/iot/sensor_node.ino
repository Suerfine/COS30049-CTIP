#include <WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>

// --- WIFI & MQTT ---
const char* ssid = "Hello"; // Change wifi name
const char* password = "12345677"; // change password
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
#define PIN_TRIG 18
#define PIN_ECHO 5
#define PIN_BUZZER 32
#define PIN_LED 2

DHT dht(PIN_TEMP, DHT11);

// --- Individual Timers for each sensor ---
unsigned long lastFireLog = 0;
unsigned long lastMicrowaveLog = 0;
unsigned long lastAcousticLog = 0;
unsigned long lastFloodLog = 0;

// --- Intervals ---
const unsigned long INT_NORMAL = 1800000; // 30 mins
const unsigned long INT_ALERT  = 300000;  // 5 mins

unsigned long lastLogTime = 0;
float avgSound = 1900.0;

// Sensor States
String microwaveStatus = "normal";
String fireStatus = "normal";
String acousticStatus = "normal";
String floodStatus = "normal";

String lastFireStatus = "normal";
String lastMicroStatus = "normal";
String lastSoundStatus = "normal";
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
  dht.begin();
  pinMode(PIN_MICROWAVE, INPUT);
  pinMode(PIN_ACOUSTIC, INPUT);
  pinMode(PIN_TRIG, OUTPUT);
  pinMode(PIN_ECHO, INPUT);
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
  String currentFireStatus = (t > 50 || smoke > 1500) ? "alert" : "normal";
  unsigned long fireInterval = (currentFireStatus == "alert") ? INT_ALERT : INT_NORMAL;

  if (currentFireStatus != lastFireStatus || (now - lastFireLog >= fireInterval)) {
    String fireData = "{";
    fireData += "\"temperature\":" + String(t) + ",";
    fireData += "\"smoke\":" + String(smoke);
    fireData += "}";
    
    sendLog(1, currentFireStatus, fireData);
    
    lastFireLog = now;
    lastFireStatus = currentFireStatus;
  }

  // 2. MICROWAVE SENSOR
  bool motion = digitalRead(PIN_MICROWAVE);
  String currentMicroStatus = motion ? "alert" : "normal";
  unsigned long microInterval = (currentMicroStatus == "alert") ? INT_ALERT : INT_NORMAL;

  if (currentMicroStatus != lastMicroStatus || (now - lastMicrowaveLog >= microInterval)) {
    String motionData = "{";
    motionData += "\"motion\":" + String(motion ? "true" : "false");
    motionData += "}";
    
    sendLog(2, currentMicroStatus, motionData);
    
    lastMicrowaveLog = now;
    lastMicroStatus = currentMicroStatus;
  }

  // 3. ACOUSTIC SENSOR
  int sound = analogRead(PIN_ACOUSTIC);
  avgSound = (avgSound * 0.9) + (sound * 0.1);
  String currentSoundStatus = (abs(sound - avgSound) > 800) ? "alert" : "normal";
  unsigned long soundInterval = (currentSoundStatus == "alert") ? INT_ALERT : INT_NORMAL;

  if (currentSoundStatus != lastSoundStatus || (now - lastAcousticLog >= soundInterval)) {
    String soundData = "{";
    soundData += "\"level\":" + String(sound);
    soundData += "}";
    
    sendLog(3, currentSoundStatus, soundData);
    
    lastAcousticLog = now;
    lastSoundStatus = currentSoundStatus;
  }

  // 4. ULTRASONIC SENSOR
  // (Insert your Trigger/Echo logic here to get 'dist')
  int dist = getDistance(); 
  String currentFloodStatus = (dist > 0 && dist < 15) ? "alert" : "normal";
  unsigned long floodInterval = (currentFloodStatus == "alert") ? INT_ALERT : INT_NORMAL;

  if (currentFloodStatus != lastFloodStatus || (now - lastFloodLog >= floodInterval)) {
    String floodData = "{";
    floodData += "\"distance\":" + String(dist);
    floodData += "}";
    
    sendLog(4, currentFloodStatus, floodData);
    
    lastFloodLog = now;
    lastFloodStatus = currentFloodStatus;
  }

  if (currentMicroStatus == "alert") {
    digitalWrite(PIN_BUZZER, HIGH); // Alarm ON
  } else {
    digitalWrite(PIN_BUZZER, LOW);  // Alarm OFF
  }

  Serial.print("DEBUG: ");
  Serial.print("Temp: " + String(t));
  Serial.print(" | Smoke: " + String(smoke));
  Serial.print(" | Motion: " + String(motion));
  Serial.print(" | Sound: " + String(sound));
  Serial.println(" | Dist: " + String(dist));
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