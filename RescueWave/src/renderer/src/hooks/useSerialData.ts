import { useCallback, useEffect, useRef, useState } from 'react'
import type { NodeTelemetry, SerialConnectionStatus, SerialPortInfo } from '@shared/types'

export interface NodeRecord extends NodeTelemetry {
  lastActive: number
}

export function useSerialData(): {
  nodes: Map<string, NodeRecord>
  selectedNodeId: string | null
  setSelectedNodeId: (id: string) => void
  selectedNode: NodeRecord | null
  connectionStatus: SerialConnectionStatus
  ports: SerialPortInfo[]
  refreshPorts: () => Promise<void>
  connect: (portPath: string) => Promise<void>
  disconnect: () => Promise<void>
  hasActiveSos: boolean
  sosNodes: string[]
} {
  const [nodes, setNodes] = useState<Map<string, NodeRecord>>(new Map())
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<SerialConnectionStatus>({
    state: 'disconnected'
  })
  const [ports, setPorts] = useState<SerialPortInfo[]>([])
  const selectedRef = useRef<string | null>(null)

  useEffect(() => {
    selectedRef.current = selectedNodeId
  }, [selectedNodeId])

  const refreshPorts = useCallback(async () => {
    const list = await window.rescueWave.listPorts()
    setPorts(list)
  }, [])

  const connect = useCallback(async (portPath: string) => {
    await window.rescueWave.connect(portPath)
  }, [])

  const disconnect = useCallback(async () => {
    await window.rescueWave.disconnect()
  }, [])

  useEffect(() => {
    void refreshPorts()
    void window.rescueWave.getStatus().then(setConnectionStatus)

    const unsubStatus = window.rescueWave.onStatus(setConnectionStatus)
    const unsubTelemetry = window.rescueWave.onTelemetry((data: NodeTelemetry) => {
      setNodes((prev) => {
        const next = new Map(prev)
        next.set(data.nodeId, { ...data, lastActive: data.timestamp })
        return next
      })

      if (!selectedRef.current) {
        setSelectedNodeId(data.nodeId)
      }
    })

    return () => {
      unsubStatus()
      unsubTelemetry()
    }
  }, [refreshPorts])

  const nodeList = Array.from(nodes.values())
  const sosNodes = nodeList.filter((n) => n.sosStatus === 'SOS').map((n) => n.nodeId)
  const hasActiveSos = sosNodes.length > 0
  const selectedNode = selectedNodeId ? (nodes.get(selectedNodeId) ?? null) : null

  return {
    nodes,
    selectedNodeId,
    setSelectedNodeId,
    selectedNode,
    connectionStatus,
    ports,
    refreshPorts,
    connect,
    disconnect,
    hasActiveSos,
    sosNodes
  }
}
