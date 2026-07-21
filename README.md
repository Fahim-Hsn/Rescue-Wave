# RescueWave: Offline Disaster Telemetry & Management System

## Overview
RescueWave is a localized, fully offline disaster management and telemetry dashboard developed. Designed to operate entirely independently of cellular and internet networks, the system relies on Long-Range (LoRa) radio frequency communication to bridge remote disaster zones with a central command dashboard. 

The system collects environmental data and emergency signals from field-deployed ESP32 hardware nodes, triggers local physical alarms at the gateway, and streams real-time updates to an interactive desktop command center. It also supports bidirectional communication, allowing operators to send remote commands back to field nodes.

---

## Key Features
*   **Complete Offline Operation:** Functions seamlessly without internet or cellular infrastructure using 433MHz LoRa RF communication.
*   **Real-Time Disaster Telemetry:** Instantly captures and displays temperature, humidity, water levels, and battery status.
*   **Multi-Tiered Emergency Detection:**
    *   Manual physical SOS override buttons on field nodes.
    *   Automated flood alerts triggered by analog water level sensors.
    *   Microwave radar motion detection for identifying trapped individuals.
*   **Two-Way Hardware Control:** Allows command operators to toggle specific field sensors (Radar, Water monitoring) ON/OFF directly from the desktop interface.
*   **Interactive Desktop Dashboard:** Built with Electron, React, and Leaflet, featuring dynamic offline mapping, auto-panning to SOS coordinates, and live node status cards.
*   **Secure Role-Based Management:** Local storage authentication system supporting Admin and Volunteer roles with comprehensive system activity logging.

---

## System Architecture & Data Flow
1.  **Field Nodes (Sender Nodes):** Placed in disaster zones. They monitor local conditions and transmit CSV payloads via LoRa.
2.  **Gateway Node (Receiver):** Connected to the desktop PC via USB. It receives LoRa packets, triggers local TFT display updates, LEDs, and buzzers, and bridges the data over Serial communication.
3.  **Desktop Dashboard (RescueWave App):** Parses incoming serial data, plots node positions on the map, logs events, and handles operator commands.

```text
[Field Nodes (Node-1 / Node-2)] 
         │
         │ (LoRa 433MHz RF Waves)
         ▼
[Gateway Node (ESP32 + TFT + Buzzer)]
         │
         │ (USB Serial / 115200 Baud)
         ▼
[RescueWave Desktop App (Electron & React)]
```

## Repository Folder Structure
```text
RescueWave_Project/
│
├── Hardware/
│   ├── RescueWave_Gateway/
│   │   ├── RescueWave_Gateway.ino
│   │   └── README.md
│   ├── RescueWave_Node1_SOS/
│   │   └── RescueWave_Node1_SOS.ino
│   ├── RescueWave_Node2_Sensors/
│   │   └── RescueWave_Node2_Sensors.ino
│   └── Docs/
│       └── Setup_Instructions.txt
│
└── OfflineApp/
    ├── src/
    │   ├── main/
    │   ├── preload/
    │   └── renderer/
    ├── package.json
    └── README.md
```

## Hardware Specifications & Bill of Materials
**Microcontrollers:** ESP32 Development Boards (DOIT DEVKIT V1)

**RF Modules:** SX1278 LoRa Modules (433MHz frequency)

**Sensors (Node-2):**
*   RCWL-0516 Microwave Radar Sensor (GPIO 32)
*   Analog Water Level Sensor (GPIO 34)

**Emergency Inputs (All Nodes):** Push Buttons configured with internal pull-up resistors (GPIO 27)

**Gateway Peripherals:**
*   1.8-inch TFT Display (ST7735)
*   Active Buzzer (GPIO 32)
*   Red LED for Emergency Alerts (GPIO 25)
*   Green LED for System Normal/Rx Status (GPIO 27)

---

## Step-by-Step Setup Instructions

### Step 1: Hardware Firmware Deployment
1. **Install Arduino IDE:** Download and open the Arduino IDE.
2. **Configure ESP32 Board Manager:**
   * Go to **File > Preferences**.
   * Add the Espressif package URL to Additional Boards Manager URLs:
     `https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json`
   * Go to **Tools > Board > Boards Manager**, search for `esp32`, and install the package.
3. **Install Required Libraries:**
   * Go to **Sketch > Include Library > Manage Libraries**.
   * Install: `LoRa` (Sandeep Mistry), `Adafruit GFX Library`, and `Adafruit ST7735 and ST7789 Library`.
4. **Flash the Nodes:**
   * Open `RescueWave_Gateway.ino`, select your ESP32 board and COM port, and upload.
   * Open `RescueWave_Node1_SOS.ino` and upload to Node-1.
   * Open `RescueWave_Node2_Sensors.ino` and upload to Node-2.
   * Ensure all nodes share the same LoRa SyncWord (`0xF3`) defined in the code.

### Step 2: Desktop Application Setup
1. Ensure **Node.js** (v18 or higher) is installed on your system.
2. Navigate to the `OfflineApp` directory via terminal or command prompt.
3. Install project dependencies:
   ```bash
   npm install
   ```
4. Launch the application in development mode:
   ```bash
   npm run dev
   ```
5. To build a standalone production installer/executable:
   ```bash
   npm run build
   ```

---

## Operational Guide
1. **Power Up:** Connect the Gateway node to the PC via USB. Power up Field Node-1 and Node-2 with appropriate 3.3V/5V power supplies and verify antennas are attached.
2. **Launch Dashboard:** Open the RescueWave desktop application and log in using administrator credentials.
3. **Establish Serial Link:** Select the correct COM port corresponding to the Gateway ESP32 and click connect. The Gateway TFT display will update to show `App: LINKED`.
4. **Monitoring & Response:**
   * View real-time telemetry updates and map pins.
   * Triggering an SOS button or detecting motion on Node-2 will instantly flash the Gateway display, sound the buzzer, illuminate the emergency LED, and send an alert to the desktop application interface.
   * Use the dashboard settings to remotely toggle node sensors as needed.

---

## Author & Project Details
*   **Developer:** Fahim Hossain (ID: 1118044)
*   **Developer:** Jobayer Ahmed (ID: 1118029)
*   **Developer:** Swaban Rahman Daniel (ID: 1118039)
*   **Academic Cohort:** 18th Batch, Department of Computer Science and Engineering (CSE)
*   **Institution:** Bangladesh Army International University of Science and Technology (BAIUST)
