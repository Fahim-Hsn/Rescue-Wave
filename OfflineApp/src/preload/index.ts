import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type {
  ConnectionStatus,
  GatewayNodePayload,
  SerialPortSummary
} from '../shared/gateway-node'

type Unsubscribe = () => void

const api = {
  listSerialPorts: (): Promise<SerialPortSummary[]> => ipcRenderer.invoke('serial:list-ports'),

  connectSerialPort: (portPath: string): Promise<{ success: boolean; message?: string }> =>
    ipcRenderer.invoke('serial:connect', portPath),

  disconnectSerialPort: (): Promise<{ success: boolean }> => ipcRenderer.invoke('serial:disconnect'),

  onNodeData: (callback: (payload: GatewayNodePayload) => void): Unsubscribe => {
    const listener = (_event: IpcRendererEvent, payload: GatewayNodePayload): void => {
      callback(payload)
    }

    ipcRenderer.on('gateway:node-data', listener)
    return () => {
      ipcRenderer.removeListener('gateway:node-data', listener)
    }
  },

  onConnectionStatus: (callback: (status: ConnectionStatus) => void): Unsubscribe => {
    const listener = (_event: IpcRendererEvent, status: ConnectionStatus): void => {
      callback(status)
    }

    ipcRenderer.on('gateway:connection-status', listener)
    return () => {
      ipcRenderer.removeListener('gateway:connection-status', listener)
    }
  },

  onPortsUpdated: (callback: (ports: SerialPortSummary[]) => void): Unsubscribe => {
    const listener = (_event: IpcRendererEvent, ports: SerialPortSummary[]) => {
      callback(ports)
    }

    ipcRenderer.on('serial:ports-updated', listener)
    return () => {
      ipcRenderer.removeListener('serial:ports-updated', listener)
    }
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-expect-error exposed for non-isolated fallback
  window.electron = electronAPI
  // @ts-expect-error exposed for non-isolated fallback
  window.api = api
}
