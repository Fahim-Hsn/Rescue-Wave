#include <LoRa.h>
#include <SPI.h>

// --- LoRa Pins ---
#define LORA_SS 5
#define LORA_RST 14
#define LORA_DIO0 2

// --- Sensor Pins ---
#define SOS_BUTTON_PIN 27
#define WATER_SENSOR_PIN 34 // Connected to 'S' pin of the water sensor

// --- Timers ---
unsigned long lastPing = 0;
unsigned long lastWaterCheck = 0;
const unsigned long PING_INTERVAL = 600000; // 10 minutes
const unsigned long WATER_CHECK_INTERVAL = 5000; // Check water every 5 seconds

void setup() {
  Serial.begin(115200);

  // Setup button with internal pull-up
  pinMode(SOS_BUTTON_PIN, INPUT_PULLUP);

  // Initialize LoRa
  LoRa.setPins(LORA_SS, LORA_RST, LORA_DIO0);
  if (!LoRa.begin(433E6)) {
    Serial.println("LoRa Module not found! Check wiring.");
    while (1)
      ;
  }

  LoRa.setSyncWord(0xF3); // Private network sync word
  Serial.println("Node-1 (SOS & Water Sensor) Initialized and Ready...");
}

void sendTelemetry(String status) {
  // Read and format water level
  int rawWater = analogRead(WATER_SENSOR_PIN);
  int waterLevel = map(rawWater, 0, 4095, 0, 100);
  waterLevel = constrain(waterLevel, 0, 100); // Ensure value stays between 0-100%

  // Dummy values to maintain the CSV payload structure
  String lat = "23.4628";
  String lng = "91.1378";
  String temp = "0";
  String hum = "0";
  String battery = "100";

  // Format: ID, Lat, Lng, Temp, Hum, Water, Battery, Status
  String payload = "ESP32-NODE-1," + lat + "," + lng + "," + temp + "," + hum +
                   "," + String(waterLevel) + "," + battery + "," + status;

  LoRa.beginPacket();
  LoRa.print(payload);
  LoRa.endPacket();

  Serial.println("Transmitted: " + payload);
}

void loop() {
  unsigned long currentMillis = millis();

  // 1. Manual SOS Button Check
  if (digitalRead(SOS_BUTTON_PIN) == LOW) {
    Serial.println("EMERGENCY! Node-1 SOS Button Pressed!");
    sendTelemetry("SOS");

    // Prevent spamming if button is held down
    delay(5000);
  }

  // 2. Continuous Water Level Monitoring for Auto-SOS
  if (currentMillis - lastWaterCheck >= WATER_CHECK_INTERVAL) {
    lastWaterCheck = currentMillis;
    
    int rawWater = analogRead(WATER_SENSOR_PIN);
    int waterLevel = map(rawWater, 0, 4095, 0, 100);
    
    if (waterLevel > 80) { // Danger threshold
      Serial.println("EMERGENCY! High Water Level Auto-Trigger!");
      sendTelemetry("SOS");
      
      // Delay to prevent network spamming during an active flood
      delay(5000); 
    }
  }

  // 3. Routine Heartbeat Update
  if (currentMillis - lastPing >= PING_INTERVAL || lastPing == 0) {
    lastPing = currentMillis;
    Serial.println("Sending Routine Heartbeat from Node-1...");
    sendTelemetry("SAFE");
  }
}
