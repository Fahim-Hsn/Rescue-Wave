import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '../../shared/types'
import type { SerialManager } from './serialManager'

export function registerSerialIpc(serialManager: SerialManager): void {
  ipcMain.handle(IPC_CHANNELS.LIST_PORTS, () => serialManager.listPorts())

  ipcMain.handle(IPC_CHANNELS.GET_STATUS, () => serialManager.getStatus())

  ipcMain.handle(IPC_CHANNELS.CONNECT, async (_event, portPath: string) => {
    if (!portPath || typeof portPath !== 'string') {
      throw new Error('Invalid port path')
    }
    await serialManager.connect(portPath)
    return serialManager.getStatus()
  })

  ipcMain.handle(IPC_CHANNELS.DISCONNECT, async () => {
    await serialManager.disconnect()
    return serialManager.getStatus()
  })
}
