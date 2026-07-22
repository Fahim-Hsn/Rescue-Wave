// File Location: OfflineApp/src/preload/index.ts
import { contextBridge, ipcRenderer } from 'electron';

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('api', {
      onSerialData: (callback: (data: any) => void) => {
        ipcRenderer.on('serial-data', (_event, value) => callback(value));
      },
      getPorts: () => ipcRenderer.invoke('get-ports'),
      connectPort: (portPath: string) => ipcRenderer.invoke('connect-port', portPath),
      disconnectPort: () => ipcRenderer.invoke('disconnect-port'),
      onPortStatus: (callback: (status: string) => void) => {
        ipcRenderer.on('port-status', (_event, value) => callback(value));
      },
      // --- NEW FEATURES BRIDGE ---
      sendSerialCommand: (command: string) => ipcRenderer.invoke('send-serial-command', command),
      exportCsv: (data: string, filename: string) => ipcRenderer.invoke('export-csv', data, filename),
      saveSettings: (settings: any) => ipcRenderer.invoke('save-settings', settings),
      getSettings: () => ipcRenderer.invoke('get-settings'),
      getHistory: () => ipcRenderer.invoke('get-history'),
      getHumanHistory: () => ipcRenderer.invoke('get-human-history')
    });
  } catch (error) {
    console.error(error);
  }
}