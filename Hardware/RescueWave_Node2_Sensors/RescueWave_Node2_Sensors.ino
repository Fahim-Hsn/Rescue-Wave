#include <LoRa.h>
#include <SPI.h>

// --- LoRa Pins ---
#define LORA_SS 5
#define LORA_RST 14
#define LORA_DIO0 2

// --- Sensor Pins ---
#define WATER_SENSOR_PIN 34
#define RADAR_PIN 32
#define SOS_BUTTON_PIN 27

unsigned long lastUpdate = 0;
const unsigned long INTERVAL = 600000; // 10 minutes

volatile bool humanDetected = false;

// --- Remote Control Flags ---
bool isRadarActive = true;
bool isWaterActive = true;

// Interrupt Service Routine for Radar
void IRAM_ATTR onMotionDetected() { humanDetected = true; }

// Helper to parse commands
String getValueByIndex(String data, char separator, int index) {
  int found = 0;
  int strIndex[] = {0, -1};
  int maxIndex = data.length() - 1;
  for (int i = 0; i <= maxIndex && found <= index; i++) {
    if (data.charAt(i) == separator || i == maxIndex) {
      found++;
      strIndex[0] = strIndex[1] + 1;
      strIndex[1] = (i == maxIndex) ? i + 1 : i;
    }
  }
  return found > index ? data.substring(strIndex[0], strIndex[1]) : "";
}

void setup() {
  Serial.begin(115200);

  // Sensor Setup
  pinMode(RADAR_PIN, INPUT);
  attachInterrupt(digitalPinToInterrupt(RADAR_PIN), onMotionDetected, RISING);
  analogReadResolution(12);
  pinMode(SOS_BUTTON_PIN, INPUT_PULLUP);

  // LoRa Setup
  LoRa.setPins(LORA_SS, LORA_RST, LORA_DIO0);
  if (!LoRa.begin(433E6)) {
    Serial.println("LoRa Module not found!");
    while (1)
      ;
  }
  LoRa.setSyncWord(0xF3);

  LoRa.receive(); // Enter receive mode to listen for PC commands
  Serial.println("Node-2 Initialized. Sensors & SOS Button Active.");
}

void sendTelemetry(String status) {
  int rawWater = analogRead(WATER_SENSOR_PIN);
  int waterLevel = map(rawWater, 0, 4095, 0, 100);

  String lat = "23.4625";
  String lng = "91.1375";
  String temp = "29.5";
  String hum = "78.0";
  String battery = "100";

  // Auto SOS if water level exceeds danger threshold
  if (status == "SAFE" && waterLevel > 80) {
    status = "SOS";
  }

  String payload = "ESP32-NODE-2," + lat + "," + lng + "," + temp + "," + hum +
                   "," + String(waterLevel) + "," + battery + "," + status;

  LoRa.beginPacket();
  LoRa.print(payload);
  LoRa.endPacket();

  Serial.println("Transmitted: " + payload);
  LoRa.receive(); // Return to listening mode after transmitting
}

void loop() {
  unsigned long currentMillis = millis();

  // --- 1. Listen for App Commands ---
  int packetSize = LoRa.parsePacket();
  if (packetSize) {
    String incomingMsg = "";
    while (LoRa.available())
      incomingMsg += (char)LoRa.read();
    incomingMsg.trim();

    if (incomingMsg.startsWith("CMD,ESP32-NODE-2")) {
      String targetSensor = getValueByIndex(incomingMsg, ',', 2);
      String cmdState = getValueByIndex(incomingMsg, ',', 3);

      if (targetSensor == "RADAR")
        isRadarActive = (cmdState == "ON");
      if (targetSensor == "WATER")
        isWaterActive = (cmdState == "ON");

      Serial.println("Settings Updated: " + targetSensor + " is now " +
                     cmdState);
    }
  }

  // --- 2. Manual SOS Button Check (Highest Priority) ---
  if (digitalRead(SOS_BUTTON_PIN) == LOW) {
    Serial.println("EMERGENCY! Node-2 SOS Button Pressed!");
    sendTelemetry("SOS");
    delay(5000);
  }

  // --- 3. Radar Logic (With RF Protection) ---
  if (isRadarActive && humanDetected) {
    // Detach interrupt to prevent LoRa RF transmission noise from locking the
    // sensor
    detachInterrupt(digitalPinToInterrupt(RADAR_PIN));

    Serial.println("Motion Detected! Sending Alert...");
    sendTelemetry("HUMAN");

    // Wait for RF noise to settle and prevent spamming
    delay(5000);

    humanDetected = false;
    // Re-attach interrupt safely
    attachInterrupt(digitalPinToInterrupt(RADAR_PIN), onMotionDetected, RISING);
  } else if (!isRadarActive) {
    humanDetected = false;
  }

  // --- 4. Routine Water Sensor & Heartbeat ---
  if (isWaterActive &&
      (currentMillis - lastUpdate >= INTERVAL || lastUpdate == 0)) {
    lastUpdate = currentMillis;
    // Only send SAFE ping if radar and SOS are idle
    if (digitalRead(RADAR_PIN) == LOW && digitalRead(SOS_BUTTON_PIN) == HIGH ||
        !isRadarActive) {
      sendTelemetry("SAFE");
    }
  }
}