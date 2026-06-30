import React from 'react';
import { NodeTelemetry } from '../../shared/gateway-node';

interface NodeCardProps {
  node: NodeTelemetry;
}

export default function NodeCard({ node }: NodeCardProps) {
  const isSOS = node.sosStatus === 'SOS';
  
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
      {/* Header: Icon, Node ID and Status Tag */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center space-x-3">
          <div className={`p-2.5 rounded-xl ${isSOS ? 'bg-red-50' : 'bg-indigo-50'}`}>
            <span className="text-xl">{isSOS ? '🚨' : '📡'}</span>
          </div>
          <div>
            <h3 className="text-sm font-bold text-indigo-950">{node.id}</h3>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">Last seen: Just now</p>
          </div>
        </div>
        <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider ${isSOS ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-indigo-700'}`}>
          {isSOS ? 'SOS ALERT' : 'ACTIVE'}
        </span>
      </div>

      {/* Coordinates (Mimicking the "Route Path" from your reference image) */}
      <div className="mb-6">
        <p className="text-[10px] font-bold text-slate-400 tracking-wider mb-2">LIVE COORDINATES</p>
        <div className="flex items-center space-x-2">
          <div className="flex items-center px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-semibold border border-emerald-100">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2"></span>
            Lat: {node.lat}
          </div>
          <span className="text-slate-300">→</span>
          <div className="flex items-center px-3 py-1.5 bg-rose-50 text-rose-700 rounded-lg text-xs font-semibold border border-rose-100">
            <span className="w-1.5 h-1.5 bg-rose-500 rounded-full mr-2"></span>
            Lng: {node.lng}
          </div>
        </div>
      </div>

      {/* Telemetry Stats (Mimicking the "Waypoints/Schedules" from your reference image) */}
      <div className="flex justify-between items-end border-t border-slate-100 pt-4">
        <div className="flex space-x-8">
          <div>
            <p className="text-[10px] font-bold text-slate-400 tracking-wider mb-1">TEMP</p>
            <p className="text-sm font-bold text-slate-700">{node.temperature}°C</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 tracking-wider mb-1">HUMIDITY</p>
            <p className="text-sm font-bold text-slate-700">{node.humidity}%</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 tracking-wider mb-1">WATER</p>
            <p className="text-sm font-bold text-slate-700">{node.waterLevel} cm</p>
          </div>
        </div>
        
        {/* Edit/Delete Icons (Bottom Right) */}
        <div className="flex space-x-3 text-slate-300">
          <button className="hover:text-indigo-600 transition-colors">✏️</button>
          <button className="hover:text-red-600 transition-colors">🗑️</button>
        </div>
      </div>
    </div>
  );
}