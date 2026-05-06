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

unsigned long lastFloodLog = 0;

// --- Intervals ---
const unsigned long INT_NORMAL = 1800000; // 30 mins
const unsigned long INT_ALERT  = 300000;  // 5 mins

unsigned long lastLogTime = 0;

// Sensor States
String floodStatus = "normal";
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
  pinMode(PIN_TRIG, OUTPUT);
  pinMode(PIN_ECHO, INPUT);
  
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