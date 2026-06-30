export type SosStatus = 'SOS' | 'OK'

export interface NodeTelemetry {
  nodeId: string
  latitude: number
  longitude: number
  temperature: number
  humidity: number
  waterLevel: number
  radarMotion: boolean
  sosStatus: SosStatus
  timestamp: number
}

export interface SerialPortInfo {
  path: string
  manufacturer?: string
  serialNumber?: string
  vendorId?: string
  productId?: string
}

export type SerialConnectionStatus =
  | { state: 'disconnected' }
  | { state: 'connecting'; portPath: string }
  | { state: 'connected'; portPath: string }
  | { state: 'reconnecting'; portPath: string; attempt: number }
  | { state: 'error'; message: string; portPath?: string }

export const IPC_CHANNELS = {
  LIST_PORTS: 'serial:list-ports',
  CONNECT: 'serial:connect',
  DISCONNECT: 'serial:disconnect',
  GET_STATUS: 'serial:get-status',
  STATUS: 'serial:status',
  TELEMETRY: 'serial:telemetry'
} as const
