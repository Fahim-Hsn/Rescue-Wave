import type { NodeRecord } from '@renderer/hooks/useSerialData'

interface TelemetryGridProps {
  node: NodeRecord | null
}

interface MetricCardProps {
  label: string
  value: string
  unit?: string
  highlight?: boolean
}

function MetricCard({ label, value, unit, highlight }: MetricCardProps): React.JSX.Element {
  return (
    <div
      className={`rounded-xl p-5 shadow-lg ${
        highlight ? 'bg-red-900/80 ring-2 ring-red-500' : 'bg-rescue-navy-light'
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-bold text-white">
        {value}
        {unit && <span className="ml-1 text-lg font-medium text-slate-300">{unit}</span>}
      </p>
    </div>
  )
}

export default function TelemetryGrid({ node }: TelemetryGridProps): React.JSX.Element {
  if (!node) {
    return (
      <div className="flex flex-1 items-center justify-center rounded-xl bg-rescue-navy/60 p-8">
        <p className="text-sm text-slate-300">
          Select a node from the sidebar or wait for incoming telemetry.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">{node.nodeId}</h2>
        <span
          className={`rounded-full px-3 py-1 text-xs font-bold ${
            node.sosStatus === 'SOS' ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'
          }`}
        >
          {node.sosStatus}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard label="Temperature" value={node.temperature.toFixed(1)} unit="°C" />
        <MetricCard label="Humidity" value={node.humidity.toFixed(1)} unit="%" />
        <MetricCard
          label="Water Level"
          value={String(node.waterLevel)}
          unit="cm"
          highlight={node.waterLevel > 100}
        />
        <MetricCard
          label="Radar Motion"
          value={node.radarMotion ? 'Detected' : 'Clear'}
          highlight={node.radarMotion}
        />
      </div>

      <div className="rounded-xl bg-rescue-navy-light p-4 text-xs text-slate-400">
        <span className="font-semibold text-slate-300">GPS:</span>{' '}
        {node.latitude.toFixed(5)}, {node.longitude.toFixed(5)}
      </div>
    </div>
  )
}
