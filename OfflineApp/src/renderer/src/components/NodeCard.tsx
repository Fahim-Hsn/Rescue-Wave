import { NodeTelemetry } from '../../../shared/gateway-node';

interface NodeCardProps {
  node: NodeTelemetry;
  rawId: string;
  sensorStates: { radar: boolean; water: boolean };
  onToggleSensor: (nodeId: string, sensor: 'RADAR' | 'WATER', currentState: boolean) => void;
}

export default function NodeCard({ node, rawId, sensorStates, onToggleSensor }: NodeCardProps) {
  const isSOS = node.sosStatus === 'SOS';
  const isHuman = node.sosStatus === 'HUMAN' && !isSOS;
  
  // Status styling logic
  let statusIcon = '📡';
  let iconBg = 'bg-indigo-50';
  let tagText = 'ACTIVE';
  let tagClass = 'bg-slate-100 text-indigo-700';
  let cardBorder = 'border-slate-200';

  if (isSOS) {
    statusIcon = '🚨';
    iconBg = 'bg-red-50';
    tagText = 'SOS ALERT';
    tagClass = 'bg-red-100 text-red-700';
    cardBorder = 'border-red-300 ring-1 ring-red-100';
  } else if (isHuman) {
    statusIcon = '🧍';
    iconBg = 'bg-orange-50';
    tagText = 'MOTION DETECTED';
    tagClass = 'bg-orange-100 text-orange-700';
    cardBorder = 'border-orange-300 ring-1 ring-orange-100';
  }

  return (
    <div className={`bg-white rounded-2xl border ${cardBorder} p-5 shadow-sm hover:shadow-md transition-shadow`}>
      {/* Header: Icon, Node ID and Status Tag */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center space-x-3">
          <div className={`p-2.5 rounded-xl ${iconBg}`}>
            <span className="text-xl">{statusIcon}</span>
          </div>
          <div>
            <h3 className="text-sm font-bold text-indigo-950">{node.id}</h3>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">Battery: {node.battery}%</p>
          </div>
        </div>
        <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider ${tagClass}`}>
          {tagText}
        </span>
      </div>

      {/* Coordinates (Mimicking the "Route Path" from your reference image) */}
      <div className="mb-4">
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
      <div className="flex justify-between items-end border-t border-slate-100 pt-4 mb-4">
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
      </div>

      {/* Sensor Controls */}
      <div className="border-t border-slate-100 pt-4 flex space-x-3">
        <button 
          onClick={() => onToggleSensor(rawId, 'RADAR', sensorStates.radar)}
          className={`flex-1 py-1.5 rounded text-xs font-bold transition-colors ${sensorStates.radar ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
        >
          Radar: {sensorStates.radar ? 'ON' : 'OFF'}
        </button>
        <button 
          onClick={() => onToggleSensor(rawId, 'WATER', sensorStates.water)}
          className={`flex-1 py-1.5 rounded text-xs font-bold transition-colors ${sensorStates.water ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
        >
          Water Level: {sensorStates.water ? 'ON' : 'OFF'}
        </button>
      </div>
    </div>
  );
}