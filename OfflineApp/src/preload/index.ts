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
      disconnectPort: () => ipcRenderer.invoke('disconnect-port'), // New disconnect handler
      onPortStatus: (callback: (status: string) => void) => {
        ipcRenderer.on('port-status', (_event, value) => callback(value));
      }
    });
  } catch (error) {
    console.error(error);
  }
}