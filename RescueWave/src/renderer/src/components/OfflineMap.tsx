import { useEffect } from 'react'
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import type { NodeRecord } from '@renderer/hooks/useSerialData'

const BAIUST_CENTER: [number, number] = [23.4567, 91.1234]
const DEFAULT_ZOOM = 16

function createNodeIcon(isSos: boolean): L.DivIcon {
  const color = isSos ? '#dc2626' : '#3a9874'
  const sosClass = isSos ? 'sos-marker' : ''

  return L.divIcon({
    className: '',
    html: `<div class="${sosClass}" style="
      width: 18px;
      height: 18px;
      background: ${color};
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 8px rgba(0,0,0,0.45);
    "></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -12]
  })
}

function MapResizeHandler(): null {
  const map = useMap()

  useEffect(() => {
    const timer = setTimeout(() => map.invalidateSize(), 100)
    return () => clearTimeout(timer)
  }, [map])

  return null
}

interface OfflineMapProps {
  nodes: NodeRecord[]
  selectedNodeId: string | null
}

export default function OfflineMap({ nodes, selectedNodeId }: OfflineMapProps): React.JSX.Element {
  const selectedNode = nodes.find((n) => n.nodeId === selectedNodeId)

  return (
    <div className="h-full min-h-[320px] overflow-hidden rounded-xl bg-rescue-navy shadow-xl">
      <MapContainer center={BAIUST_CENTER} zoom={DEFAULT_ZOOM} className="h-full w-full">
        <TileLayer
          url="/offline-tiles/{z}/{x}/{y}.png"
          attribution="RescueWave Offline Tiles"
          maxZoom={19}
          minZoom={10}
        />
        <MapResizeHandler />

        {nodes.map((node) => (
          <Marker
            key={node.nodeId}
            position={[node.latitude, node.longitude]}
            icon={createNodeIcon(node.sosStatus === 'SOS')}
          >
            <Popup>
              <strong>{node.nodeId}</strong>
              <br />
              Status: {node.sosStatus}
              <br />
              Temp: {node.temperature.toFixed(1)}°C
              <br />
              Water: {node.waterLevel} cm
            </Popup>
          </Marker>
        ))}

        {selectedNode && (
          <MapFlyTo lat={selectedNode.latitude} lng={selectedNode.longitude} />
        )}
      </MapContainer>
    </div>
  )
}

function MapFlyTo({ lat, lng }: { lat: number; lng: number }): null {
  const map = useMap()

  useEffect(() => {
    map.flyTo([lat, lng], map.getZoom(), { duration: 0.8 })
  }, [lat, lng, map])

  return null
}
