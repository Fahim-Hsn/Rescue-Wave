// File Location: OfflineApp/src/main/serial-manager.ts
import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';
import { BrowserWindow, ipcMain } from 'electron';
import { parseGatewayLine } from '../shared/gateway-node';

class SerialManager {
  private port: SerialPort | null = null;
  private parser: ReadlineParser | null = null;
  private verificationTimeout: NodeJS.Timeout | null = null;
  private pingInterval: NodeJS.Timeout | null = null;

  public registerIpcHandlers() {
    ipcMain.handle('get-ports', async () => {
      const ports = await SerialPort.list();
      return ports.map(p => p.path);
    });

    ipcMain.handle('connect-port', async (_event, portPath: string) => {
      return this.connect(portPath);
    });

    ipcMain.handle('disconnect-port', async () => {
      return this.disconnect();
    });
  }

  public connect(portPath: string): boolean {
    const mainWindow = BrowserWindow.getAllWindows()[0];

    if (this.port?.isOpen) {
      this.disconnect();
    }

    try {
      this.port = new SerialPort({ path: portPath, baudRate: 115200 });
      this.parser = this.port.pipe(new ReadlineParser({ delimiter: '\n' }));

      this.port.on('open', () => {
        console.log(`Port ${portPath} opened. Initiating handshake sequence...`);
        
        // Retrying ping every 500ms because ESP32 reboots upon serial connection
        this.pingInterval = setInterval(() => {
          if (this.port && this.port.isOpen) {
            this.port.write("GATEWAY_PING\n");
          }
        }, 500);

        // Fail connection if device fails to respond within 4 seconds
        this.verificationTimeout = setTimeout(() => {
          if (this.pingInterval) clearInterval(this.pingInterval);
          console.log("Handshake timeout. Invalid peripheral.");
          if (mainWindow) mainWindow.webContents.send('port-status', 'error');
          this.disconnect();
        }, 4000);
      });

      this.parser.on('data', (line: string) => {
        line = line.trim();
        
        // Listen to explicit authentication acknowledgements
        if (line === "GATEWAY_PONG") {
          if (this.verificationTimeout) clearTimeout(this.verificationTimeout);
          if (this.pingInterval) clearInterval(this.pingInterval);
          if (mainWindow) mainWindow.webContents.send('port-status', 'connected');
          console.log("RescueWave Gateway verified successfully.");
          return;
        }

        if (line === "GATEWAY_ACK_DISCONNECT") {
          return;
        }

        // Forward legitimate telemetry payloads to Renderer process
        const parsedData = parseGatewayLine(line);
        if (parsedData && mainWindow) {
          mainWindow.webContents.send('serial-data', parsedData);
        }
      });

      this.port.on('error', (err) => {
        console.error("Serial Port Error:", err.message);
        if (mainWindow) mainWindow.webContents.send('port-status', 'error');
      });

      this.port.on('close', () => {
        if (mainWindow) mainWindow.webContents.send('port-status', 'disconnected');
      });

      return true;
    } catch (error) {
      console.error("Connection instance generation failed:", error);
      return false;
    }
  }

  public disconnect(): boolean {
    const mainWindow = BrowserWindow.getAllWindows()[0];
    if (this.verificationTimeout) clearTimeout(this.verificationTimeout);
    if (this.pingInterval) clearInterval(this.pingInterval);
    
    if (this.port && this.port.isOpen) {
      this.port.write("GATEWAY_DISCONNECT\n", () => {
        this.port?.close(() => {
          this.port = null;
          this.parser = null;
          if (mainWindow) mainWindow.webContents.send('port-status', 'disconnected');
        });
      });
      return true;
    }
    return false;
  }

  public async start() {
    console.log("Serial Manager Pipeline Initialized.");
  }

  public dispose() {
    this.disconnect();
  }
}

export const serialManager = new SerialManager();