interface AlertBannerProps {
  active: boolean
  sosNodes: string[]
}

export default function AlertBanner({ active, sosNodes }: AlertBannerProps): React.JSX.Element | null {
  if (!active) return null

  const label =
    sosNodes.length === 1
      ? `SOS ALERT — ${sosNodes[0]} requires immediate assistance!`
      : `SOS ALERT — ${sosNodes.length} nodes require immediate assistance!`

  return (
    <div className="sos-banner-flash fixed inset-x-0 top-0 z-50 flex items-center justify-center bg-red-600 px-6 py-3 text-center text-sm font-bold tracking-wide text-white shadow-lg md:text-base">
      <span className="mr-2 text-lg">🚨</span>
      {label}
    </div>
  )
}
