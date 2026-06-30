import type { SerialConnectionStatus, SerialPortInfo } from '@shared/types'
import type { NodeRecord } from '@renderer/hooks/useSerialData'

interface NodeSidebarProps {
  nodes: NodeRecord[]
  selectedNodeId: string | null
  onSelectNode: (nodeId: string) => void
  connectionStatus: SerialConnectionStatus
  ports: SerialPortInfo[]
  onRefreshPorts: () => void
  onConnect: (portPath: string) => void
  onDisconnect: () => void
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

function statusLabel(status: SerialConnectionStatus): string {
  switch (status.state) {
    case 'connected':
      return `Connected (${status.portPath})`
    case 'connecting':
      return `Connecting to ${status.portPath}…`
    case 'reconnecting':
      return `Reconnecting (${status.attempt})…`
    case 'error':
      return status.message
    default:
      return 'Disconnected'
  }
}

export default function NodeSidebar({
  nodes,
  selectedNodeId,
  onSelectNode,
  connectionStatus,
  ports,
  onRefreshPorts,
  onConnect,
  onDisconnect
}: NodeSidebarProps): React.JSX.Element {
  const isConnected =
    connectionStatus.state === 'connected' || connectionStatus.state === 'reconnecting'
  const sortedNodes = [...nodes].sort((a, b) => b.lastActive - a.lastActive)

  return (
    <aside className="flex h-full w-72 shrink-0 flex-col rounded-xl bg-rescue-navy shadow-xl">
      <div className="border-b border-slate-600 p-4">
        <h1 className="text-lg font-bold text-white">RescueWave</h1>
        <p className="mt-1 text-xs text-slate-400">Disaster Survival System</p>
      </div>

      <div className="border-b border-slate-600 p-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Gateway Serial
        </p>
        <p className="mb-3 text-xs text-slate-300">{statusLabel(connectionStatus)}</p>

        {!isConnected ? (
          <div className="space-y-2">
            <select
              className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-teal-400"
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) onConnect(e.target.value)
              }}
            >
              <option value="" disabled>
                Select COM port…
              </option>
              {ports.map((port) => (
                <option key={port.path} value={port.path}>
                  {port.path}
                  {port.manufacturer ? ` — ${port.manufacturer}` : ''}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={onRefreshPorts}
              className="w-full rounded-lg bg-slate-700 px-3 py-2 text-xs font-medium text-white transition hover:bg-slate-600"
            >
              Refresh Ports
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onDisconnect}
            className="w-full rounded-lg bg-red-700 px-3 py-2 text-xs font-medium text-white transition hover:bg-red-600"
          >
            Disconnect
          </button>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
          End Nodes ({sortedNodes.length})
        </p>

        <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto">
          {sortedNodes.length === 0 ? (
            <li className="rounded-lg bg-slate-800/60 px-3 py-4 text-center text-xs text-slate-400">
              Waiting for LoRa telemetry…
            </li>
          ) : (
            sortedNodes.map((node) => {
              const isSelected = node.nodeId === selectedNodeId
              const isSos = node.sosStatus === 'SOS'

              return (
                <li key={node.nodeId}>
                  <button
                    type="button"
                    onClick={() => onSelectNode(node.nodeId)}
                    className={`w-full rounded-lg px-3 py-3 text-left transition ${
                      isSelected
                        ? 'bg-teal-600/30 ring-2 ring-teal-400'
                        : 'bg-slate-800/80 hover:bg-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-white">{node.nodeId}</span>
                      {isSos && (
                        <span className="rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white">
                          SOS
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-[11px] text-slate-400">
                      Last seen: {formatTime(node.lastActive)}
                    </p>
                  </button>
                </li>
              )
            })
          )}
        </ul>
      </div>
    </aside>
  )
}
