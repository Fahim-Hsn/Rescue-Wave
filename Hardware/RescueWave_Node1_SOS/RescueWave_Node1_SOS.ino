#include <LoRa.h>
#include <SPI.h>

// --- LoRa Pins ---
#define LORA_SS 5
#define LORA_RST 14
#define LORA_DIO0 2

// --- SOS Button Pin ---
#define SOS_BUTTON_PIN 27

// --- Routine Ping Timer ---
unsigned long lastPing = 0;
const unsigned long PING_INTERVAL = 600000; // 10 minutes

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
  Serial.println("Node-1 (SOS Only on GPIO 27) Initialized and Ready...");
}

void sendTelemetry(String status) {
  // Dummy values to maintain the CSV payload structure
  String lat = "23.4628";
  String lng = "91.1378";
  String temp = "0";
  String hum = "0";
  String waterLevel = "0";
  String battery = "100";

  // Format: ID, Lat, Lng, Temp, Hum, Water, Battery, Status
  String payload = "ESP32-NODE-1," + lat + "," + lng + "," + temp + "," + hum +
                   "," + waterLevel + "," + battery + "," + status;

  LoRa.beginPacket();
  LoRa.print(payload);
  LoRa.endPacket();

  Serial.println("Transmitted: " + payload);
}

void loop() {
  // 1. Manual SOS Button Check
  if (digitalRead(SOS_BUTTON_PIN) == LOW) {
    Serial.println("EMERGENCY! Node-1 SOS Button Pressed!");
    sendTelemetry("SOS");

    // Prevent spamming if button is held down
    delay(5000);
  }

  // 2. Routine Heartbeat Update
  if (millis() - lastPing >= PING_INTERVAL || lastPing == 0) {
    lastPing = millis();
    Serial.println("Sending Routine Heartbeat from Node-1...");
    sendTelemetry("SAFE");
  }
}