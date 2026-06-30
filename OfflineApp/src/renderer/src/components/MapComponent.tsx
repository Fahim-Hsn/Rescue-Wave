// File Location: OfflineApp/src/renderer/src/components/MapComponent.tsx
import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, LayersControl } from 'react-leaflet';
import L from 'leaflet';

import { NodeTelemetry } from '../../shared/gateway-node';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// Default Icon (For safe remote nodes)
const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

// SOS Icon (Red color for danger alerts)
const SOSIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  className: 'hue-rotate-[150deg] brightness-90', 
});

// Gateway Icon (Deep purple/blue icon for BAIUST Base)
const GatewayIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [35, 51],
  iconAnchor: [17, 51],
  popupAnchor: [1, -40],
  className: 'hue-rotate-[250deg] brightness-75',
});

L.Marker.prototype.options.icon = DefaultIcon;

// Map Controller for Auto-Focus and sizing
function MapController({ nodes, baseCoords }: { nodes: NodeTelemetry[], baseCoords: [number, number] }) {
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
}

export default function MapComponent({ nodes }: MapProps) {
  // Exact Coordinates for BAIUST, Cumilla Cantonment
  const baiustCoords: [number, number] = [23.4622, 91.1370];
  
  return (
    <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm relative z-0" style={{ height: '450px', width: '100%' }}>
      <MapContainer 
        center={baiustCoords} 
        zoom={16} 
        style={{ height: '100%', width: '100%', zIndex: 0 }}
      >
        <MapController nodes={nodes} baseCoords={baiustCoords} />
        
        {/* --- DUAL MAP CONTROL (Satellite & Road View) --- */}
        <LayersControl position="topright">
          
          {/* 1. Road View (Standard Map) */}
          <LayersControl.BaseLayer name="🛣️ Road View">
            <TileLayer
              attribution='&copy; Google Maps Road'
              url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
            />
          </LayersControl.BaseLayer>

          {/* 2. Satellite View (Set as Default Checked) */}
          <LayersControl.BaseLayer checked name="🛰️ Satellite View">
            <TileLayer
              attribution='&copy; Google Maps Satellite'
              url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
            />
          </LayersControl.BaseLayer>

        </LayersControl>

        {/* --- PERMANENT BAIUST HQ PIN --- */}
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
        
        {/* --- DYNAMIC SENSOR NODES --- */}
        {nodes.map((node) => (
          <Marker 
            key={node.id} 
            position={[node.lat, node.lng]}
            icon={node.sosStatus === 'SOS' ? SOSIcon : DefaultIcon}
          >
            <Popup className="rounded-xl font-sans min-w-[150px]">
              <div className="text-center">
                <strong className="text-indigo-950 block text-sm mb-1">{node.id}</strong>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${node.sosStatus === 'SOS' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                  {node.sosStatus === 'SOS' ? 'SOS TRIGGERED' : 'SAFE'}
                </span>
                <div className="mt-3 text-xs text-slate-600 text-left bg-slate-50 p-2 rounded border border-slate-100">
                  <p className="mb-1">Temp: <b className="text-slate-800">{node.temperature}°C</b></p>
                  <p>Water: <b className="text-slate-800">{node.waterLevel} cm</b></p>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}