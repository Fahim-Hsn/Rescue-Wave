import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type {
  NodeTelemetry,
  SerialConnectionStatus,
  SerialPortInfo
} from '../shared/types'
import { IPC_CHANNELS } from '../shared/types'

export interface RescueWaveAPI {
  listPorts: () => Promise<SerialPortInfo[]>
  connect: (portPath: string) => Promise<SerialConnectionStatus>
  disconnect: () => Promise<SerialConnectionStatus>
  getStatus: () => Promise<SerialConnectionStatus>
  onStatus: (callback: (status: SerialConnectionStatus) => void) => () => void
  onTelemetry: (callback: (data: NodeTelemetry) => void) => () => void
}

const rescueWaveAPI: RescueWaveAPI = {
  listPorts: () => ipcRenderer.invoke(IPC_CHANNELS.LIST_PORTS),
  connect: (portPath) => ipcRenderer.invoke(IPC_CHANNELS.CONNECT, portPath),
  disconnect: () => ipcRenderer.invoke(IPC_CHANNELS.DISCONNECT),
  getStatus: () => ipcRenderer.invoke(IPC_CHANNELS.GET_STATUS),
  onStatus: (callback) => {
    const listener = (_event: Electron.IpcRendererEvent, status: SerialConnectionStatus): void => {
      callback(status)
    }
    ipcRenderer.on(IPC_CHANNELS.STATUS, listener)
    return () => ipcRenderer.removeListener(IPC_CHANNELS.STATUS, listener)
  },
  onTelemetry: (callback) => {
    const listener = (_event: Electron.IpcRendererEvent, data: NodeTelemetry): void => {
      callback(data)
    }
    ipcRenderer.on(IPC_CHANNELS.TELEMETRY, listener)
    return () => ipcRenderer.removeListener(IPC_CHANNELS.TELEMETRY, listener)
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('rescueWave', rescueWaveAPI)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-expect-error legacy fallback
  window.electron = electronAPI
  // @ts-expect-error legacy fallback
  window.rescueWave = rescueWaveAPI
}
