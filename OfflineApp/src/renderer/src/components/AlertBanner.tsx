import type { GatewayNodePayload } from '../../../shared/gateway-node'

interface AlertBannerProps {
  active: boolean
  sosNodes: GatewayNodePayload[]
}

function AlertBanner({ active, sosNodes }: AlertBannerProps): React.JSX.Element {
  if (active) {
    const nodeIds = sosNodes.map((node) => node.id).join(', ')

    return (
      <header
        className="sos-banner-active flex items-center justify-between gap-4 border-b border-red-800 bg-red-600 px-6 py-3 text-white shadow-lg"
        role="alert"
        aria-live="assertive"
      >
        <div className="flex items-center gap-3">
          <span className="sos-dot-active inline-flex h-3 w-3 rounded-full bg-white" />
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em]">Emergency SOS Detected</p>
            <p className="text-sm text-red-100">
              {sosNodes.length === 1
                ? `${nodeIds} is broadcasting a distress signal.`
                : `${sosNodes.length} nodes in distress: ${nodeIds}`}
            </p>
          </div>
        </div>
        <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
          Immediate Response Required
        </span>
      </header>
    )
  }

  return (
    <header className="flex items-center justify-between gap-4 border-b border-rescue-teal-dark/40 bg-rescue-navy/90 px-6 py-3 text-white backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-3 w-3 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.15em] text-emerald-300">
            System Nominal
          </p>
          <p className="text-sm text-slate-300">All monitored nodes reporting OK status.</p>
        </div>
      </div>
      <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300">
        Offline Mode Active
      </span>
    </header>
  )
}

export default AlertBanner
