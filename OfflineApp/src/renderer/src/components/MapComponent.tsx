// File Location: OfflineApp/src/renderer/src/components/MapComponent.tsx
import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, LayersControl, Polyline } from 'react-leaflet';
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

const GatewayIcon = L.divIcon({
  html: `<div class="flex flex-col items-center">
           <svg class="w-10 h-10 text-emerald-500 drop-shadow-md" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
           <span class="bg-white px-2 py-0.5 rounded shadow-sm text-[11px] font-bold text-emerald-700 whitespace-nowrap -mt-2">সুরক্ষা বাড়ি</span>
         </div>`,
  className: 'bg-transparent',
  iconSize: [40, 50],
  iconAnchor: [20, 50],
  popupAnchor: [0, -50],
});

const getAlertIcon = (name: string) => L.divIcon({
  html: `<div class="flex flex-col items-center animate-bounce">
           <svg class="w-10 h-10 text-rose-600 drop-shadow-md" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
           <span class="bg-rose-600 px-2 py-0.5 rounded shadow-md text-[11px] font-bold text-white whitespace-nowrap -mt-2">${name}</span>
         </div>`,
  className: 'bg-transparent',
  iconSize: [40, 50],
  iconAnchor: [20, 50],
  popupAnchor: [0, -50],
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
    const alertNode = nodes.find(n => n.sosStatus === 'SOS' || n.sosStatus === 'HUMAN');
    if (alertNode) {
      map.flyTo([alertNode.lat, alertNode.lng], 17, { animate: true, duration: 1.5 });
    }
  }, [nodes, map]);

  return null;
}

interface MapProps {
  nodes: NodeTelemetry[];
  nodeNames: Record<string, string>;
  controlNodeLocation: { lat: number, lng: number };
}

export default function MapComponent({ nodes, nodeNames, controlNodeLocation }: MapProps) {
  const centerCoords: [number, number] = [controlNodeLocation.lat, controlNodeLocation.lng];
  
  return (
    <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm relative z-0" style={{ height: '450px', width: '100%' }}>
      <MapContainer 
        center={centerCoords} 
        zoom={16} 
        style={{ height: '100%', width: '100%', zIndex: 0 }}
      >
        <MapController nodes={nodes} />
        
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name="🛣️ Road View">
            <TileLayer
              attribution='&copy; Google Maps Road'
              url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
            />
          </LayersControl.BaseLayer>

          <LayersControl.BaseLayer name="🛰️ Satellite View">
            <TileLayer
              attribution='&copy; Google Maps Satellite'
              url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
            />
          </LayersControl.BaseLayer>
        </LayersControl>

        <Marker position={centerCoords} icon={GatewayIcon} zIndexOffset={1000}>
          <Popup className="rounded-xl font-sans min-w-[200px]">
            <div className="text-center p-1">
              <strong className="text-indigo-950 block text-xs mb-1 uppercase leading-tight">
                Control Node / HQ
              </strong>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 mt-1 inline-block">
                সুরক্ষা বাড়ি
              </span>
            </div>
          </Popup>
        </Marker>
        
        {nodes.map((node) => {
          const displayName = nodeNames[node.id] || node.id;
          const hasCustomName = !!nodeNames[node.id];
          const isAlert = node.sosStatus === 'SOS' || node.sosStatus === 'HUMAN';

          return (
            <React.Fragment key={node.id}>
              {isAlert && (
                <Polyline 
                  positions={[
                    [controlNodeLocation.lat, controlNodeLocation.lng],
                    [node.lat, node.lng]
                  ]}
                  pathOptions={{ 
                    color: '#e11d48', // rose-600
                    weight: 5,
                    opacity: 0.9,
                    lineJoin: 'round'
                  }}
                />
              )}
              <Marker 
                position={[node.lat, node.lng]}
                icon={isAlert ? getAlertIcon(displayName) : DefaultIcon}
                zIndexOffset={isAlert ? 999 : 1}
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
            </React.Fragment>
          );
        })}
      </MapContainer>
    </div>
  );
}