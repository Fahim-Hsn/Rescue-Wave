import { ElectronAPI } from '@electron-toolkit/preload'
import type { RescueWaveAPI } from './index'

declare global {
  interface Window {
    electron: ElectronAPI
    rescueWave: RescueWaveAPI
  }
}

export {}
