import { useEffect, useState } from 'react'
import L from 'leaflet'
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import type { GatewayNodePayload } from '../../../shared/gateway-node'
import 'leaflet/dist/leaflet.css'

const BAIUST_CENTER: L.LatLngExpression = [23.4567, 91.1234]
const DEFAULT_ZOOM = 16

interface MapComponentProps {
  nodes: GatewayNodePayload[]
  selectedNodeId: string | null
  onSelectNode?: (nodeId: string) => void
}

function createNodeIcon(isSos: boolean, isSelected: boolean): L.DivIcon {
  const color = isSos ? '#dc2626' : '#3a9874'
  const ring = isSelected ? '0 0 0 3px rgba(255,255,255,0.9), 0 0 16px rgba(58,152,116,0.8)' : '0 2px 8px rgba(0,0,0,0.45)'
  const pulse = isSos ? 'animation: sos-pulse 1.2s ease-in-out infinite;' : ''

  return L.divIcon({
    className: '',
    html: `
      <div style="
        width: 28px;
        height: 28px;
        border-radius: 50% 50% 50% 0;
        background: ${color};
        transform: rotate(-45deg);
        border: 2px solid white;
        box-shadow: ${ring};
        ${pulse}
      ">
        <div style="
          width: 8px;
          height: 8px;
          background: white;
          border-radius: 50%;
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(45deg);
        "></div>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -30]
  })
}

function MapFocus({ node }: { node: GatewayNodePayload | null }): null {
  const map = useMap()

  useEffect(() => {
    if (node) {
      map.flyTo([node.latitude, node.longitude], 17, { duration: 0.8 })
    }
  }, [node, map])

  return null
}

function MapComponent({ nodes, selectedNodeId, onSelectNode }: MapComponentProps): React.JSX.Element {
  const [mounted, setMounted] = useState(false)
  const selectedNode =
    selectedNodeId != null ? nodes.find((node) => node.nodeId === selectedNodeId) ?? null : null

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="rescue-map flex h-full min-h-[320px] w-full items-center justify-center rounded-2xl border border-white/10 bg-rescue-navy/70">
        <p className="text-sm text-slate-400">Loading map…</p>
      </div>
    )
  }

  return (
    <div className="rescue-map h-full min-h-[320px] w-full overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
      <MapContainer
        center={BAIUST_CENTER}
        zoom={DEFAULT_ZOOM}
        className="h-full w-full"
        scrollWheelZoom
        zoomControl
      >
        <TileLayer
          url="/map-tiles/{z}/{x}/{y}.png"
          attribution="RescueWave Offline Map"
          maxZoom={18}
          minZoom={14}
        />

        <Marker position={BAIUST_CENTER} icon={createCampusIcon()}>
          <Popup>
            <strong>BAIUST Campus</strong>
            <br />
            Command center · 23.4567, 91.1234
          </Popup>
        </Marker>

        {nodes.map((node) => {
          const isSos = node.sosStatus === 'SOS'
          const isSelected = selectedNodeId === node.nodeId

          return (
            <Marker
              key={node.nodeId}
              position={[node.latitude, node.longitude]}
              icon={createNodeIcon(isSos, isSelected)}
              eventHandlers={{
                click: () => onSelectNode?.(node.nodeId)
              }}
            >
              <Popup>
                <div className="min-w-[160px] text-sm text-slate-800">
                  <p className="font-bold">{node.nodeId}</p>
                  <p className={isSos ? 'font-semibold text-red-600' : 'text-emerald-700'}>
                    Status: {node.sosStatus}
                  </p>
                  <p>Temp: {node.temperature.toFixed(1)}°C</p>
                  <p>Humidity: {node.humidity.toFixed(0)}%</p>
                  <p>Water: {node.waterLevel} cm</p>
                  <p>Motion: {node.radarMotion ? 'Detected' : 'Clear'}</p>
                </div>
              </Popup>
            </Marker>
          )
        })}

        <MapFocus node={selectedNode} />
      </MapContainer>
    </div>
  )
}

function createCampusIcon(): L.DivIcon {
  return L.divIcon({
    className: '',
    html: `
      <div style="
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: #0f172a;
        border: 3px solid #5eead4;
        box-shadow: 0 0 12px rgba(94,234,212,0.7);
      "></div>
    `,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -12]
  })
}

export default MapComponent
