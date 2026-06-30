import { BrowserWindow, ipcMain } from 'electron'
import { SerialPort } from 'serialport'
import { ReadlineParser } from '@serialport/parser-readline'
import {
  ConnectionStatus,
  GatewayNodePayload,
  SerialPortSummary,
  parseGatewayLine
} from '../shared/gateway-node'

const BAUD_RATE = 115200
const RECONNECT_DELAY_MS = 3000

const IPC = {
  LIST_PORTS: 'serial:list-ports',
  CONNECT: 'serial:connect',
  DISCONNECT: 'serial:disconnect',
  NODE_DATA: 'gateway:node-data',
  CONNECTION_STATUS: 'gateway:connection-status',
  PORTS_UPDATED: 'serial:ports-updated'
} as const

class SerialManager {
  private port: SerialPort | null = null
  private activePath: string | null = null
  private reconnectTimer: NodeJS.Timeout | null = null
  private shouldReconnect = false
  private manualDisconnect = false

  registerIpcHandlers(): void {
    ipcMain.handle(IPC.LIST_PORTS, () => this.listPorts())
    ipcMain.handle(IPC.CONNECT, (_event, portPath: string) => this.connect(portPath))
    ipcMain.handle(IPC.DISCONNECT, () => {
      this.manualDisconnect = true
      this.shouldReconnect = false
      this.clearReconnectTimer()
      this.closePort()
      this.broadcastStatus({ state: 'disconnected' })
      return { success: true }
    })
  }

  async start(): Promise<void> {
    const ports = await this.listPorts()
    this.broadcast(IPC.PORTS_UPDATED, ports)

    const espPort = this.pickEsp32Port(ports)
    if (espPort) {
      await this.connect(espPort.path)
    }
  }

  dispose(): void {
    this.manualDisconnect = true
    this.shouldReconnect = false
    this.clearReconnectTimer()
    this.closePort()
    ipcMain.removeHandler(IPC.LIST_PORTS)
    ipcMain.removeHandler(IPC.CONNECT)
    ipcMain.removeHandler(IPC.DISCONNECT)
  }

  private async listPorts(): Promise<SerialPortSummary[]> {
    const ports = await SerialPort.list()
    return ports.map((port) => ({
      path: port.path,
      manufacturer: port.manufacturer,
      serialNumber: port.serialNumber,
      vendorId: port.vendorId,
      productId: port.productId
    }))
  }

  private pickEsp32Port(ports: SerialPortSummary[]): SerialPortSummary | undefined {
    if (ports.length === 0) return undefined

    const espLike = ports.find((port) => {
      const manufacturer = port.manufacturer?.toLowerCase() ?? ''
      return (
        manufacturer.includes('silicon labs') ||
        manufacturer.includes('espressif') ||
        manufacturer.includes('usb-serial') ||
        manufacturer.includes('ch340') ||
        manufacturer.includes('cp210')
      )
    })

    return espLike ?? ports[0]
  }

  private async connect(portPath: string): Promise<{ success: boolean; message?: string }> {
    if (!portPath) {
      return { success: false, message: 'No port path provided.' }
    }

    if (this.port?.isOpen && this.activePath === portPath) {
      return { success: true }
    }

    this.manualDisconnect = false
    this.shouldReconnect = true
    this.clearReconnectTimer()
    this.closePort()

    this.broadcastStatus({ state: 'connecting', port: portPath })

    try {
      const port = new SerialPort({
        path: portPath,
        baudRate: BAUD_RATE,
        autoOpen: false
      })

      await new Promise<void>((resolve, reject) => {
        port.open((error) => {
          if (error) reject(error)
          else resolve()
        })
      })

      const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }))

      parser.on('data', (line: string) => {
        this.handleIncomingLine(line)
      })

      port.on('close', () => {
        this.handlePortClosed()
      })

      port.on('error', (error) => {
        console.error('[SerialManager] Port error:', error.message)
        this.broadcastStatus({
          state: 'error',
          message: error.message,
          port: this.activePath ?? portPath
        })
      })

      this.port = port
      this.activePath = portPath

      this.broadcastStatus({ state: 'connected', port: portPath })
      return { success: true }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to open serial port.'
      this.broadcastStatus({ state: 'error', message, port: portPath })
      this.scheduleReconnect(portPath)
      return { success: false, message }
    }
  }

  private handleIncomingLine(line: string): void {
    const payload = parseGatewayLine(line)
    if (!payload) {
      console.warn('[SerialManager] Ignored malformed line:', line)
      return
    }

    this.broadcast(IPC.NODE_DATA, payload satisfies GatewayNodePayload)
  }

  private handlePortClosed(): void {
    const closedPort = this.activePath
    this.port = null
    this.activePath = null

    if (this.manualDisconnect) {
      this.broadcastStatus({ state: 'disconnected' })
      return
    }

    this.broadcastStatus({
      state: 'error',
      message: 'Serial port disconnected.',
      port: closedPort ?? undefined
    })

    if (this.shouldReconnect && closedPort) {
      this.scheduleReconnect(closedPort)
    } else {
      this.broadcastStatus({ state: 'disconnected' })
    }
  }

  private scheduleReconnect(portPath: string): void {
    this.clearReconnectTimer()
    this.reconnectTimer = setTimeout(() => {
      if (this.shouldReconnect && !this.manualDisconnect) {
        void this.connect(portPath)
      }
    }, RECONNECT_DELAY_MS)
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
  }

  private closePort(): void {
    if (!this.port) return

    const portToClose = this.port
    this.port = null
    this.activePath = null

    if (portToClose.isOpen) {
      portToClose.close()
    }
  }

  private broadcastStatus(status: ConnectionStatus): void {
    this.broadcast(IPC.CONNECTION_STATUS, status)
  }

  private broadcast(channel: string, payload: unknown): void {
    for (const window of BrowserWindow.getAllWindows()) {
      if (!window.isDestroyed()) {
        window.webContents.send(channel, payload)
      }
    }
  }
}

export const serialManager = new SerialManager()
