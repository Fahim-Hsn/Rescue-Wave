// File Location: OfflineApp/src/renderer/src/components/MapComponent.tsx
import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, LayersControl } from 'react-leaflet';
import L from 'leaflet';
import { NodeTelemetry } from '../../../shared/gateway-node';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const SOSIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  className: 'hue-rotate-[150deg] brightness-90', 
});

const HumanIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  className: 'hue-rotate-[320deg] brightness-105 saturate-150', // Makes it orange-ish
});

const GatewayIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [35, 51],
  iconAnchor: [17, 51],
  popupAnchor: [1, -40],
  className: 'hue-rotate-[250deg] brightness-75',
});

L.Marker.prototype.options.icon = DefaultIcon;

function MapController({ nodes }: { nodes: NodeTelemetry[] }) {
  const map = useMap();
  
  useEffect(() => {
    setTimeout(() => {
      map.invalidateSize();
    }, 250);
  }, [map]);

  useEffect(() => {
    const sosNode = nodes.find(n => n.sosStatus === 'SOS');
    if (sosNode) {
      map.flyTo([sosNode.lat, sosNode.lng], 18, { animate: true, duration: 1.5 });
    }
  }, [nodes, map]);

  return null;
}

interface MapProps {
  nodes: NodeTelemetry[];
  nodeNames: Record<string, string>;
}

export default function MapComponent({ nodes, nodeNames }: MapProps) {
  // BAIUST Default Location
  const baiustCoords: [number, number] = [23.4622, 91.1370];
  
  return (
    <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm relative z-0" style={{ height: '450px', width: '100%' }}>
      <MapContainer 
        center={baiustCoords} 
        zoom={16} 
        style={{ height: '100%', width: '100%', zIndex: 0 }}
      >
        <MapController nodes={nodes} />
        
        <LayersControl position="topright">
          
          {/* Road View (Set as Default Checked) */}
          <LayersControl.BaseLayer checked name="🛣️ Road View">
            <TileLayer
              attribution='&copy; Google Maps Road'
              url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
            />
          </LayersControl.BaseLayer>

          {/* Satellite View */}
          <LayersControl.BaseLayer name="🛰️ Satellite View">
            <TileLayer
              attribution='&copy; Google Maps Satellite'
              url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
            />
          </LayersControl.BaseLayer>

        </LayersControl>

        <Marker position={baiustCoords} icon={GatewayIcon} zIndexOffset={1000}>
          <Popup className="rounded-xl font-sans min-w-[200px]">
            <div className="text-center p-1">
              <strong className="text-indigo-950 block text-xs mb-1 uppercase leading-tight">
                Bangladesh Army International University of Science & Technology
              </strong>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700 mt-1 inline-block">
                BAIUST HQ (GATEWAY)
              </span>
            </div>
          </Popup>
        </Marker>
        
        {nodes.map((node) => {
          const displayName = nodeNames[node.id] || node.id;
          const hasCustomName = !!nodeNames[node.id];

          return (
            <Marker 
              key={node.id} 
              position={[node.lat, node.lng]}
              icon={node.sosStatus === 'SOS' ? SOSIcon : node.sosStatus === 'HUMAN' ? HumanIcon : DefaultIcon}
            >
              <Popup className="rounded-xl font-sans min-w-[150px]">
                <div className="text-center">
                  <strong className="text-indigo-950 block text-sm mb-0.5">
                    {displayName}
                  </strong>
                  {hasCustomName && (
                    <span className="text-[10px] text-slate-400 block mb-1">({node.id})</span>
                  )}
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${node.sosStatus === 'SOS' ? 'bg-red-100 text-red-700' : node.sosStatus === 'HUMAN' ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {node.sosStatus === 'SOS' ? 'SOS TRIGGERED' : node.sosStatus === 'HUMAN' ? 'MOTION DETECTED' : 'SAFE'}
                  </span>
                  <div className="mt-3 text-xs text-slate-600 text-left bg-slate-50 p-2 rounded border border-slate-100">
                    <p className="mb-1">Temp: <b className="text-slate-800">{node.temperature}°C</b></p>
                    <p>Water: <b className="text-slate-800">{node.waterLevel} cm</b></p>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}