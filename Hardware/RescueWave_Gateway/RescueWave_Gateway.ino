// রিসিভার বা গেটওয়ের মূল কোড (TFT, Buzzer, LoRa, Serial)
#include <Adafruit_GFX.h>
#include <Adafruit_ST7735.h>
#include <LoRa.h>
#include <SPI.h>

// --- LoRa Pins ---
#define LORA_SS 5
#define LORA_RST_NEW 26
#define LORA_DIO0 2

// --- TFT Display Pins ---
#define TFT_SCLK 14
#define TFT_MOSI 13
#define TFT_CS 15
#define TFT_DC 4
#define TFT_RST 12

// --- Indicator & Alarm Pins ---
#define RED_LED 25
#define GREEN_LED 27
#define BUZZER 32

// Initialize TFT
Adafruit_ST7735 tft =
    Adafruit_ST7735(TFT_CS, TFT_DC, TFT_MOSI, TFT_SCLK, TFT_RST);

// --- Colors for UI ---
#define COLOR_BG 0x3CCE
#define COLOR_CARD 0x10A2
#define COLOR_ACCENT 0xFFFF
#define COLOR_ALERT 0xF800
#define COLOR_HUMAN 0xFD20 // Orange for Human Detect
#define COLOR_TEXT 0xFFFF
#define COLOR_WARN 0xFFE0

// --- System Variables ---
String knownNodes[10];
int nodeCount = 0;
String lastActiveNode = "None";

bool isAppConnected = false;
String rxBuffer = "";

// ====== Sound Effects ======
void playStartupSound() {
  tone(BUZZER, 1046, 150);
  delay(150);
  tone(BUZZER, 1318, 150);
  delay(150);
  tone(BUZZER, 1568, 200);
  delay(200);
  noTone(BUZZER);
}
void playNodeAddedBeep() {
  tone(BUZZER, 2000, 100);
  delay(100);
  tone(BUZZER, 2500, 150);
  delay(150);
  noTone(BUZZER);
}
void playConnectMusic() {
  tone(BUZZER, 523, 100);
  delay(100);
  tone(BUZZER, 659, 100);
  delay(100);
  tone(BUZZER, 1046, 200);
  delay(200);
  noTone(BUZZER);
}
void playDisconnectMusic() {
  tone(BUZZER, 1046, 100);
  delay(100);
  tone(BUZZER, 784, 100);
  delay(100);
  tone(BUZZER, 523, 250);
  delay(250);
  noTone(BUZZER);
}
void playSOSAlarm() {
  tone(BUZZER, 2200);
  delay(5000);
  noTone(BUZZER);
}
void playHumanAlarm() {
  for (int i = 0; i < 5; i++) {
    tone(BUZZER, 1500, 300);
    delay(300);
    tone(BUZZER, 1000, 300);
    delay(300);
  }
  noTone(BUZZER);
}

// ====== Helper Function: Parse CSV String ======
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

// ====== UI Functions ======
void drawNormalUI() {
  tft.fillScreen(COLOR_BG);
  tft.fillRoundRect(2, 2, 156, 22, 4, COLOR_CARD);
  tft.drawRoundRect(2, 2, 156, 22, 4, COLOR_ACCENT);
  tft.setTextColor(COLOR_ACCENT);
  tft.setTextSize(1);
  tft.setCursor(18, 9);
  tft.print("RescueWave : BAIUST");

  tft.fillRoundRect(2, 28, 76, 52, 4, COLOR_CARD);
  tft.setTextColor(COLOR_TEXT);
  tft.setCursor(6, 34);
  tft.print("SYSTEM:");
  tft.setTextColor(ST77XX_GREEN);
  tft.setCursor(6, 48);
  tft.print("RX: ON");
  tft.setTextColor(COLOR_WARN);
  tft.setCursor(6, 62);
  tft.print("NODES: ");
  tft.print(nodeCount);

  tft.fillRoundRect(82, 28, 76, 52, 4, COLOR_CARD);
  tft.setTextColor(COLOR_TEXT);
  tft.setCursor(86, 34);
  tft.print("NETWORK:");
  tft.setTextColor(COLOR_WARN);
  tft.setCursor(86, 48);
  tft.print("433 MHz");

  tft.setCursor(86, 62);
  if (isAppConnected) {
    tft.setTextColor(ST77XX_CYAN);
    tft.print("App: LINKED");
  } else {
    tft.setTextColor(ST77XX_ORANGE);
    tft.print("APP: WAIT");
  }

  tft.fillRoundRect(2, 84, 156, 42, 4, COLOR_CARD);
  tft.drawRoundRect(2, 84, 156, 42, 4, ST77XX_WHITE);
  tft.setTextColor(COLOR_WARN);
  tft.setCursor(6, 92);
  tft.print("LAST PING:");
  tft.setTextColor(ST77XX_CYAN);
  tft.setCursor(6, 108);
  tft.print(lastActiveNode);
}

void drawAlertUI(String triggerNode, String lat, String lng, String title,
                 uint16_t bgColor) {
  tft.fillScreen(bgColor);
  tft.fillRoundRect(10, 10, 140, 108, 8, ST77XX_WHITE);
  tft.drawRoundRect(10, 10, 140, 108, 8, ST77XX_BLACK);

  tft.setTextColor(bgColor);
  if (title.length() > 10) {
    tft.setTextSize(1);
    tft.setCursor(20, 25);
  } else {
    tft.setTextSize(2);
    tft.setCursor(25, 20);
  }
  tft.print(title);

  tft.setTextSize(1);
  tft.setTextColor(ST77XX_BLACK);
  tft.setCursor(15, 50);
  tft.print("Node: ");
  tft.setTextColor(ST77XX_BLUE);
  tft.print(triggerNode);

  tft.setTextColor(ST77XX_BLACK);
  tft.setCursor(15, 70);
  tft.print("Lat: ");
  tft.setTextColor(ST77XX_RED);
  tft.print(lat);

  tft.setTextColor(ST77XX_BLACK);
  tft.setCursor(15, 90);
  tft.print("Lng: ");
  tft.setTextColor(ST77XX_RED);
  tft.print(lng);
}

// ====== Serial Handshake (PC to ESP32) ======
void handleSerialCommunication() {
  while (Serial.available() > 0) {
    char incomingChar = (char)Serial.read();

    if (incomingChar == '\n') {
      rxBuffer.trim();

      if (rxBuffer == "GATEWAY_PING") {
        isAppConnected = true;
        Serial.println("GATEWAY_PONG");
        playConnectMusic();
        drawNormalUI();
      } else if (rxBuffer == "GATEWAY_DISCONNECT") {
        isAppConnected = false;
        Serial.println("GATEWAY_ACK_DISCONNECT");
        playDisconnectMusic();
        drawNormalUI();
      } else if (rxBuffer.startsWith("CMD,")) {
        // App থেকে আসা কমান্ড LoRa তে ট্রান্সমিট করা
        LoRa.beginPacket();
        LoRa.print(rxBuffer);
        LoRa.endPacket();
        LoRa.receive(); // 다시 listen mode
      }
      rxBuffer = "";
    } else if (incomingChar != '\r') {
      rxBuffer += incomingChar;
    }
  }
}

// ====== Main Setup ======
void setup() {
  Serial.begin(115200);

  pinMode(RED_LED, OUTPUT);
  pinMode(GREEN_LED, OUTPUT);
  pinMode(BUZZER, OUTPUT);

  digitalWrite(GREEN_LED, HIGH); // Default state
  digitalWrite(RED_LED, LOW);
  digitalWrite(BUZZER, LOW);

  // Initialize Screen
  tft.initR(INITR_BLACKTAB);
  tft.setRotation(1); // Landscape
  playStartupSound();
  drawNormalUI();

  // Initialize LoRa
  LoRa.setPins(LORA_SS, LORA_RST_NEW, LORA_DIO0);
  if (!LoRa.begin(433E6)) {
    Serial.println("LoRa Error! Check wiring.");
    while (1)
      ;
  }
  LoRa.setSyncWord(0xF3); // Must match Sender Nodes
  LoRa.receive();         // Put into listening mode

  Serial.println("Gateway Initialized...");
}

// ====== Main Loop ======
void loop() {
  handleSerialCommunication(); // Check for PC commands

  // Check for incoming LoRa packets
  int packetSize = LoRa.parsePacket();
  if (packetSize) {
    String incomingMsg = "";
    while (LoRa.available())
      incomingMsg += (char)LoRa.read();
    incomingMsg.trim();

    // Forward data to React App (if connected and not an internal ACK)
    if (isAppConnected && !incomingMsg.startsWith("ACK_")) {
      Serial.println(incomingMsg);
    }

    // Parse Payload
    String senderID = getValueByIndex(incomingMsg, ',', 0);
    String statusStr = getValueByIndex(incomingMsg, ',', 7);

    if (senderID.length() > 0 && senderID.startsWith("ESP32")) {
      // Manage Connected Nodes List
      bool isNewNode = true;
      for (int i = 0; i < nodeCount; i++) {
        if (knownNodes[i] == senderID) {
          isNewNode = false;
          break;
        }
      }
      if (isNewNode && nodeCount < 10) {
        knownNodes[nodeCount] = senderID;
        nodeCount++;
        lastActiveNode = senderID;
        playNodeAddedBeep();
        drawNormalUI();
      }

      // Handle Emergencies
      if (statusStr == "SOS" || statusStr == "HUMAN") {
        digitalWrite(GREEN_LED, LOW);
        digitalWrite(RED_LED, HIGH);

        String lat = getValueByIndex(incomingMsg, ',', 1);
        String lng = getValueByIndex(incomingMsg, ',', 2);

        if (statusStr == "SOS") {
          drawAlertUI(senderID, lat, lng, "SOS ALERT", COLOR_ALERT);
          playSOSAlarm();
        } else {
          drawAlertUI(senderID, lat, lng, "HUMAN DETECT", COLOR_HUMAN);
          playHumanAlarm();
        }

        // Reset UI after alarm
        digitalWrite(RED_LED, LOW);
        digitalWrite(GREEN_LED, HIGH);
        drawNormalUI();
      }
    }
  }
}