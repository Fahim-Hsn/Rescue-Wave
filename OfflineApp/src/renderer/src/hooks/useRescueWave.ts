import { useCallback, useEffect, useMemo, useState } from 'react'
import type {
  ConnectionStatus,
  GatewayNodePayload,
  SerialPortSummary
} from '../../../shared/gateway-node'

export function useRescueWave() {
  const [nodes, setNodes] = useState<Record<string, GatewayNodePayload>>({})
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    state: 'disconnected'
  })
  const [availablePorts, setAvailablePorts] = useState<SerialPortSummary[]>([])

  useEffect(() => {
    const unsubscribeNode = window.api.onNodeData((payload) => {
      setNodes((current) => ({
        ...current,
        [payload.nodeId]: payload
      }))
    })

    const unsubscribeStatus = window.api.onConnectionStatus(setConnectionStatus)
    const unsubscribePorts = window.api.onPortsUpdated(setAvailablePorts)

    void window.api.listSerialPorts().then(setAvailablePorts)

    return () => {
      unsubscribeNode()
      unsubscribeStatus()
      unsubscribePorts()
    }
  }, [])

  const nodeList = useMemo(
    () =>
      Object.values(nodes).sort((a, b) => {
        if (a.sosStatus !== b.sosStatus) {
          return a.sosStatus === 'SOS' ? -1 : 1
        }
        return a.nodeId.localeCompare(b.nodeId)
      }),
    [nodes]
  )

  const hasSosAlert = useMemo(
    () => nodeList.some((node) => node.sosStatus === 'SOS'),
    [nodeList]
  )

  const sosNodes = useMemo(
    () => nodeList.filter((node) => node.sosStatus === 'SOS'),
    [nodeList]
  )

  const connectPort = useCallback(async (portPath: string) => {
    return window.api.connectSerialPort(portPath)
  }, [])

  const disconnectPort = useCallback(async () => {
    return window.api.disconnectSerialPort()
  }, [])

  const refreshPorts = useCallback(async () => {
    const ports = await window.api.listSerialPorts()
    setAvailablePorts(ports)
    return ports
  }, [])

  return {
    nodeList,
    hasSosAlert,
    sosNodes,
    connectionStatus,
    availablePorts,
    connectPort,
    disconnectPort,
    refreshPorts
  }
}
