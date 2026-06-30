import { ElectronAPI } from '@electron-toolkit/preload'
import type {
  ConnectionStatus,
  GatewayNodePayload,
  SerialPortSummary
} from '../shared/gateway-node'

type Unsubscribe = () => void

export interface RescueWaveAPI {
  listSerialPorts: () => Promise<SerialPortSummary[]>
  connectSerialPort: (portPath: string) => Promise<{ success: boolean; message?: string }>
  disconnectSerialPort: () => Promise<{ success: boolean }>
  onNodeData: (callback: (payload: GatewayNodePayload) => void) => Unsubscribe
  onConnectionStatus: (callback: (status: ConnectionStatus) => void) => Unsubscribe
  onPortsUpdated: (callback: (ports: SerialPortSummary[]) => void) => Unsubscribe
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: RescueWaveAPI
  }
}
