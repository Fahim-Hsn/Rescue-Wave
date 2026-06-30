import { SerialPort } from 'serialport'
import { ReadlineParser } from '@serialport/parser-readline'
import { BrowserWindow } from 'electron'
import type { NodeTelemetry, SerialConnectionStatus, SerialPortInfo } from '../../shared/types'
import { IPC_CHANNELS } from '../../shared/types'
import { parseTelemetryLine } from './parser'

const BAUD_RATE = 115200
const RECONNECT_DELAY_MS = 3000
const MAX_RECONNECT_ATTEMPTS = 10

export class SerialManager {
  private port: SerialPort | null = null
  private portPath: string | null = null
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private reconnectAttempt = 0
  private intentionalDisconnect = false
  private status: SerialConnectionStatus = { state: 'disconnected' }

  async listPorts(): Promise<SerialPortInfo[]> {
    const ports = await SerialPort.list()
    return ports.map((port) => ({
      path: port.path,
      manufacturer: port.manufacturer,
      serialNumber: port.serialNumber,
      vendorId: port.vendorId,
      productId: port.productId
    }))
  }

  getStatus(): SerialConnectionStatus {
    return this.status
  }

  async connect(portPath: string): Promise<void> {
    this.intentionalDisconnect = false
    this.clearReconnectTimer()
    await this.openPort(portPath)
  }

  async disconnect(): Promise<void> {
    this.intentionalDisconnect = true
    this.clearReconnectTimer()
    await this.closePort()
    this.setStatus({ state: 'disconnected' })
  }

  private async openPort(portPath: string): Promise<void> {
    await this.closePort()

    this.portPath = portPath
    this.setStatus({ state: 'connecting', portPath })

    return new Promise((resolve, reject) => {
      const port = new SerialPort({
        path: portPath,
        baudRate: BAUD_RATE,
        autoOpen: false
      })

      const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }))

      parser.on('data', (line: string) => {
        const telemetry = parseTelemetryLine(line)
        if (telemetry) {
          this.broadcastTelemetry(telemetry)
        }
      })

      port.on('error', (error) => {
        console.error('[serial] Port error:', error.message)
        this.setStatus({
          state: 'error',
          message: error.message,
          portPath
        })
      })

      port.on('close', () => {
        console.log('[serial] Port closed:', portPath)
        this.port = null

        if (!this.intentionalDisconnect && this.portPath) {
          this.scheduleReconnect()
        } else {
          this.setStatus({ state: 'disconnected' })
        }
      })

      port.open((error) => {
        if (error) {
          this.port = null
          this.setStatus({
            state: 'error',
            message: error.message,
            portPath
          })
          reject(error)
          return
        }

        this.port = port
        this.reconnectAttempt = 0
        this.setStatus({ state: 'connected', portPath })
        resolve()
      })
    })
  }

  private scheduleReconnect(): void {
    if (!this.portPath || this.intentionalDisconnect) return

    this.reconnectAttempt += 1

    if (this.reconnectAttempt > MAX_RECONNECT_ATTEMPTS) {
      this.setStatus({
        state: 'error',
        message: `Failed to reconnect after ${MAX_RECONNECT_ATTEMPTS} attempts`,
        portPath: this.portPath
      })
      return
    }

    this.setStatus({
      state: 'reconnecting',
      portPath: this.portPath,
      attempt: this.reconnectAttempt
    })

    this.clearReconnectTimer()
    this.reconnectTimer = setTimeout(() => {
      if (this.portPath && !this.intentionalDisconnect) {
        this.openPort(this.portPath).catch((error) => {
          console.error('[serial] Reconnect failed:', error.message)
          this.scheduleReconnect()
        })
      }
    }, RECONNECT_DELAY_MS)
  }

  private async closePort(): Promise<void> {
    const port = this.port
    this.port = null

    if (!port) return

    return new Promise((resolve) => {
      if (!port.isOpen) {
        resolve()
        return
      }

      port.close(() => resolve())
    })
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
  }

  private setStatus(status: SerialConnectionStatus): void {
    this.status = status
    this.broadcastStatus(status)
  }

  private broadcastStatus(status: SerialConnectionStatus): void {
    for (const window of BrowserWindow.getAllWindows()) {
      window.webContents.send(IPC_CHANNELS.STATUS, status)
    }
  }

  private broadcastTelemetry(telemetry: NodeTelemetry): void {
    for (const window of BrowserWindow.getAllWindows()) {
      window.webContents.send(IPC_CHANNELS.TELEMETRY, telemetry)
    }
  }

  dispose(): void {
    this.intentionalDisconnect = true
    this.clearReconnectTimer()
    void this.closePort()
  }
}
