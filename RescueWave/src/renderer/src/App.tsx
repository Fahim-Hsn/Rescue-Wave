import AlertBanner from '@renderer/components/AlertBanner'
import NodeSidebar from '@renderer/components/NodeSidebar'
import OfflineMap from '@renderer/components/OfflineMap'
import TelemetryGrid from '@renderer/components/TelemetryGrid'
import { useSerialData } from '@renderer/hooks/useSerialData'
import { useSosAlert } from '@renderer/hooks/useSosAlert'

function App(): React.JSX.Element {
  const {
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
  } = useSerialData()

  useSosAlert(hasActiveSos)

  const nodeList = Array.from(nodes.values())

  return (
    <div className="relative flex h-full flex-col">
      <AlertBanner active={hasActiveSos} sosNodes={sosNodes} />

      <div className={`flex h-full gap-4 p-4 ${hasActiveSos ? 'pt-16' : ''}`}>
        <NodeSidebar
          nodes={nodeList}
          selectedNodeId={selectedNodeId}
          onSelectNode={setSelectedNodeId}
          connectionStatus={connectionStatus}
          ports={ports}
          onRefreshPorts={() => void refreshPorts()}
          onConnect={(port) => void connect(port)}
          onDisconnect={() => void disconnect()}
        />

        <main className="flex min-w-0 flex-1 flex-col gap-4">
          <section className="rounded-xl bg-rescue-navy/80 p-5 shadow-xl backdrop-blur-sm">
            <TelemetryGrid node={selectedNode} />
          </section>

          <section className="min-h-0 flex-1">
            <OfflineMap nodes={nodeList} selectedNodeId={selectedNodeId} />
          </section>
        </main>
      </div>
    </div>
  )
}

export default App
