# RescueWave Gateway Node

## Overview
The Gateway Node is the central hub of the RescueWave Disaster Telemetry System. It is responsible for bridging the communication between the remote field nodes (Sender Nodes) and the RescueWave Desktop Dashboard. 

Operating entirely offline via LoRa (Long Range) RF communication (433MHz), the Gateway listens for incoming telemetry data and emergency alerts (SOS/Human Detection). Upon receiving an alert, it triggers local hardware alarms (TFT display alerts, LEDs, and Buzzer) and forwards the parsed data to the desktop application via USB Serial communication. It also supports two-way communication, allowing the desktop application to send commands back to the field nodes to toggle sensors remotely.

## Hardware Components
*   ESP32 Microcontroller Development Board
*   SX1278 LoRa Module (433MHz)
*   1.8-inch TFT Display (ST7735 or ST7789)
*   Active Buzzer
*   Red LED (Emergency Indicator)
*   Green LED (System Active/Rx Indicator)
*   Resistors (220Ω or 330Ω for LEDs)
*   Breadboard and Jumper Wires

## Pinout and Connections

### 1. LoRa Module (SX1278)
Ensure the LoRa module is powered strictly by 3.3V. Using 5V will permanently damage the module. Always attach the antenna before powering the module.

| LoRa Pin | ESP32 Pin | Function |
| :--- | :--- | :--- |
| VCC | 3.3V | Power Supply (Strictly 3.3V) |
| GND | GND | Ground |
| NSS / CS | GPIO 5 | Chip Select |
| MOSI | GPIO 23 | Master Out Slave In |
| MISO | GPIO 19 | Master In Slave Out |
| SCK | GPIO 18 | Serial Clock |
| RST | GPIO 26 | Reset |
| DIO0 | GPIO 2 | Interrupt / Data Ready |

### 2. TFT Display (ST7735)
| TFT Pin | ESP32 Pin | Function |
| :--- | :--- | :--- |
| VCC / BL | 3.3V | Power & Backlight |
| GND | GND | Ground |
| SCLK / SCK| GPIO 14 | Display Clock |
| MOSI / SDA| GPIO 13 | Display Data |
| CS | GPIO 15 | Chip Select |
| DC / A0 | GPIO 4 | Data / Command |
| RST | GPIO 12 | Reset |

### 3. Alarm and Indicators
| Component | ESP32 Pin | Function |
| :--- | :--- | :--- |
| Red LED (+) | GPIO 25 | Emergency Alert Indicator |
| Green LED (+) | GPIO 27 | System Normal / Rx Indicator |
| Buzzer (+) | GPIO 32 | Audio Alarm |

*Note: Connect the negative (-) legs of the LEDs and Buzzer to GND. Use appropriate current-limiting resistors for the LEDs.*

## Software Dependencies
Before uploading the code via the Arduino IDE, ensure the following libraries are installed:
1.  `LoRa` by Sandeep Mistry (For SX1278 communication)
2.  `Adafruit GFX Library` by Adafruit (Core graphics library)
3.  `Adafruit ST7735 and ST7789 Library` by Adafruit (Hardware-specific display driver)

## Data Protocol (Serial Communication)
The Gateway communicates with the desktop application over the USB Serial port at a Baud Rate of `115200`.

### Incoming (Hardware to App)
The Gateway forwards received LoRa packets as CSV strings:
Format: `NodeID,Latitude,Longitude,Temperature,Humidity,WaterLevel,Battery,Status`
Example: `ESP32-NODE-2,23.4625,91.1375,29.5,78.0,45,100,SAFE`

### Outgoing (App to Hardware)
The Gateway accepts command strings from the app to transmit over LoRa:
Format: `CMD,NodeID,TargetSensor,State`
Example: `CMD,ESP32-NODE-2,RADAR,OFF`

## Setup Instructions
1.  Wire the components according to the pinout tables above.
2.  Connect the ESP32 to your PC via USB.
3.  Open `RescueWave_Gateway.ino` in the Arduino IDE.
4.  Select the correct ESP32 board and COM port.
5.  Compile and upload the code.
6.  Open the Serial Monitor (115200 baud) to verify the "Gateway Initialized..." startup message.

## Important Notes
*   The `SyncWord` is set to `0xF3` in the code. This must match the `SyncWord` on all Sender Nodes for the network to communicate privately.
*   Keep the LoRa antenna well-separated from the ESP32 and TFT display to avoid RF interference.