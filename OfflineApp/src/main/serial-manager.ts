// File Location: OfflineApp/src/main/serial-manager.ts
import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';
import { BrowserWindow, ipcMain, app, dialog } from 'electron';
import { parseGatewayLine } from '../shared/gateway-node';
import fs from 'fs';
import path from 'path';

class SerialManager {
  private port: SerialPort | null = null;
  private parser: ReadlineParser | null = null;
  private verificationTimeout: NodeJS.Timeout | null = null;
  private pingInterval: NodeJS.Timeout | null = null;

  // Local Database Paths
  private get historyFile() { return path.join(app.getPath('userData'), 'sos_history.json'); }
  private get settingsFile() { return path.join(app.getPath('userData'), 'node_settings.json'); }

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

    ipcMain.handle('send-serial-command', async (_event, command: string) => {
      if (this.port && this.port.isOpen) {
        this.port.write(command + '\n');
        return true;
      }
      return false;
    });

    ipcMain.handle('save-settings', (_e, data) => {
      fs.writeFileSync(this.settingsFile, JSON.stringify(data));
    });

    ipcMain.handle('get-settings', () => {
      try { return fs.existsSync(this.settingsFile) ? JSON.parse(fs.readFileSync(this.settingsFile, 'utf-8')) : {}; }
      catch { return {}; }
    });

    ipcMain.handle('get-history', () => {
      try { return fs.existsSync(this.historyFile) ? JSON.parse(fs.readFileSync(this.historyFile, 'utf-8')) : []; }
      catch { return []; }
    });

    ipcMain.handle('export-csv', async (_e, csvData: string, defaultName: string) => {
      const { filePath } = await dialog.showSaveDialog({
        defaultPath: defaultName,
        filters: [{ name: 'CSV File', extensions: ['csv'] }]
      });
      if (filePath) {
        fs.writeFileSync(filePath, csvData);
        return true;
      }
      return false;
    });
  }

  public connect(portPath: string): boolean {
    const mainWindow = BrowserWindow.getAllWindows()[0];
    if (this.port?.isOpen) this.disconnect();

    try {
      this.port = new SerialPort({ path: portPath, baudRate: 115200 });
      this.parser = this.port.pipe(new ReadlineParser({ delimiter: '\n' }));

      this.port.on('open', () => {
        console.log(`Port ${portPath} opened. Waiting for ESP32 boot sequence...`);

        setTimeout(() => {
          this.pingInterval = setInterval(() => {
            if (this.port && this.port.isOpen) {
              this.port.write("GATEWAY_PING\n");
            }
          }, 500);
        }, 1500);

        this.verificationTimeout = setTimeout(() => {
          if (this.pingInterval) clearInterval(this.pingInterval);
          console.log("Handshake timeout. Connection Failed.");
          if (mainWindow) mainWindow.webContents.send('port-status', 'error');
          this.disconnect();
        }, 6000);
      });

      this.parser.on('data', (line: string) => {
        line = line.trim();
        if (!line) return;

        if (line.includes("GATEWAY_PONG")) {
          if (this.verificationTimeout) clearTimeout(this.verificationTimeout);
          if (this.pingInterval) clearInterval(this.pingInterval);
          if (mainWindow) mainWindow.webContents.send('port-status', 'connected');
          console.log("Hardware Verified Successfully.");
          return;
        }

        if (line.includes("GATEWAY_ACK_DISCONNECT")) {
          return;
        }

        const parsedData = parseGatewayLine(line);
        if (parsedData && mainWindow) {
          mainWindow.webContents.send('serial-data', parsedData);

          if (parsedData.sosStatus === "SOS") {
            try {
              let history: { id: number; time: string; node: string; lat: number; lng: number }[] = [];
              if (fs.existsSync(this.historyFile)) {
                history = JSON.parse(fs.readFileSync(this.historyFile, 'utf-8'));
              }
              history.unshift({
                id: Date.now(),
                time: new Date().toLocaleString(),
                node: parsedData.id,
                lat: parsedData.lat,
                lng: parsedData.lng
              });
              if (history.length > 100) history.pop();
              fs.writeFileSync(this.historyFile, JSON.stringify(history));
            } catch (err) {
              console.error("Failed to save SOS history:", err);
            }
          }
        }
      });

      this.port.on('error', () => {
        if (mainWindow) mainWindow.webContents.send('port-status', 'error');
      });

      this.port.on('close', () => {
        if (mainWindow) mainWindow.webContents.send('port-status', 'disconnected');
      });

      return true;
    } catch (error) {
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
    console.log("Serial Manager Ready.");
  }

  // --- FIX: Added the missing dispose method for app closing ---
  public dispose() {
    this.disconnect();
  }
}

export const serialManager = new SerialManager();