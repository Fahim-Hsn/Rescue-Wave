// File Location: OfflineApp/src/renderer/src/App.tsx
import React, { useState, useEffect } from 'react';
import NodeSidebar from './components/NodeSidebar';
import NodeCard from './components/NodeCard';
import MapComponent from './components/MapComponent';
import { NodeTelemetry } from '../../shared/gateway-node';

declare global {
  interface Window {
    api: {
      onSerialData: (callback: (data: NodeTelemetry) => void) => void;
      getPorts: () => Promise<string[]>;
      connectPort: (portPath: string) => Promise<boolean>;
      disconnectPort: () => Promise<boolean>;
      onPortStatus: (callback: (status: string) => void) => void;
    };
  }
}

function App(): JSX.Element {
  const [nodes, setNodes] = useState<NodeTelemetry[]>([]);
  const [ports, setPorts] = useState<string[]>([]);
  const [selectedPort, setSelectedPort] = useState<string>('');
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');

  useEffect(() => {
    fetchPorts();

    window.api.onSerialData((newData: NodeTelemetry) => {
      setNodes((prevNodes) => {
        // Prevent duplicate IDs, only update existing or add new
        const existingIndex = prevNodes.findIndex((n) => n.id === newData.id);
        if (existingIndex !== -1) {
          const updatedNodes = [...prevNodes];
          updatedNodes[existingIndex] = newData;
          return updatedNodes;
        }
        return [...prevNodes, newData];
      });
    });

    window.api.onPortStatus((status: string) => {
      setConnectionStatus(status as 'disconnected' | 'connecting' | 'connected' | 'error');
      // If hardware disconnects, clear the dashboard nodes to stay in sync
      if (status === 'disconnected') {
        setNodes([]); 
      }
    });
  }, []);

  const fetchPorts = async () => {
    const availablePorts = await window.api.getPorts();
    setPorts(availablePorts);
    if (availablePorts.length > 0 && !selectedPort) {
      setSelectedPort(availablePorts[0]);
    }
  };

  const handleConnect = async () => {
    if (!selectedPort) return;
    setConnectionStatus('connecting');
    // Clear old data when establishing a new connection
    setNodes([]);
    await window.api.connectPort(selectedPort);
  };

  const handleDisconnect = async () => {
    await window.api.disconnectPort();
    setNodes([]); // Clear nodes on manual disconnect
  };

  // Manual Refresh / Sync Button Handler
  const handleSyncTelemetry = () => {
    // This clears the frontend state. Next time hardware sends data, it will repopulate.
    if (connectionStatus === 'connected') {
      setNodes([]);
    }
  };

  const activeNodesCount = nodes.length;
  const sosAlertsCount = nodes.filter(n => n.sosStatus === 'SOS').length;

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900">
      <NodeSidebar />

      <main className="flex-1 ml-64 overflow-y-auto">
        
        {connectionStatus === 'disconnected' && (
          <div className="bg-amber-500 text-white text-center py-2 text-xs font-bold tracking-wider sticky top-0 z-20 shadow-sm">
            ⚠️ WARNING: GATEWAY DISCONNECTED - SERIAL INTEGRATION OFFLINE
          </div>
        )}
        {connectionStatus === 'error' && (
          <div className="bg-rose-600 text-white text-center py-2 text-xs font-bold tracking-wider sticky top-0 z-20 shadow-sm animate-pulse">
            ❌ AUTHENTICATION ERROR: INVALID HARDWARE NODE OR TIMEOUT ON DEVICE LINK
          </div>
        )}

        <header className="px-8 py-6 flex justify-between items-center border-b border-slate-200 bg-white/50 backdrop-blur-sm sticky top-0 z-10">
          <div>
            <h2 className="text-2xl font-bold text-indigo-950">System Overview</h2>
            <p className="text-sm text-slate-500 mt-1">Real-time disaster area telemetry</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center bg-white rounded-lg border border-slate-200 shadow-sm p-1">
              <button 
                onClick={fetchPorts} 
                className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors"
                title="Refresh Ports"
                disabled={connectionStatus === 'connected' || connectionStatus === 'connecting'}
              >
                🔄
              </button>
              <div className="w-px h-5 bg-slate-200 mx-1"></div>
              <select
                className="bg-transparent border-none text-sm font-bold text-slate-700 py-1.5 pl-2 pr-6 focus:ring-0 cursor-pointer outline-none w-32"
                value={selectedPort}
                onChange={(e) => setSelectedPort(e.target.value)}
                disabled={connectionStatus === 'connected' || connectionStatus === 'connecting'}
              >
                {ports.length === 0 ? (
                  <option value="">No ports</option>
                ) : (
                  ports.map(port => (
                    <option key={port} value={port}>{port}</option>
                  ))
                )}
              </select>
            </div>

            {connectionStatus === 'connected' ? (
              <button
                onClick={handleDisconnect}
                className="px-6 py-2.5 rounded-lg text-sm font-bold shadow-sm bg-rose-600 text-white hover:bg-rose-700 transition-all shadow-rose-600/20"
              >
                DISCONNECT ×
              </button>
            ) : (
              <button
                onClick={handleConnect}
                disabled={connectionStatus === 'connecting' || !selectedPort}
                className={`px-6 py-2.5 rounded-lg text-sm font-bold shadow-sm transition-all ${
                  connectionStatus === 'connecting' ? 'bg-amber-500 text-white cursor-wait' :
                  'bg-indigo-950 text-white hover:bg-indigo-900 shadow-indigo-950/20 disabled:opacity-50'
                }`}
              >
                {connectionStatus === 'connecting' ? 'VERIFYING...' : 'CONNECT ESP32'}
              </button>
            )}
          </div>
        </header>

        <div className="p-8">
          
          {/* MAP SECTION (Now with Satellite View) */}
          <div className="mb-10 relative z-0">
            <div className="flex justify-between items-end mb-4">
              <h3 className="text-sm font-bold text-indigo-900 tracking-wide uppercase">Live Deployment Map</h3>
              <span className="text-xs font-semibold px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full shadow-sm">
                Satellite View Active 🛰️
              </span>
            </div>
            <MapComponent nodes={nodes} />
          </div>

          {/* STATS SECTION */}
          <div className="grid grid-cols-4 gap-6 mb-10">
            {[
              { label: 'Total Nodes', value: activeNodesCount.toString() },
              { label: 'Active Nodes', value: activeNodesCount.toString() },
              { label: 'SOS Alerts', value: sosAlertsCount.toString(), isAlert: sosAlertsCount > 0 },
              { label: 'System Status', value: connectionStatus === 'connected' ? 'ONLINE' : 'OFFLINE', isAlert: connectionStatus !== 'connected' }
            ].map((stat, idx) => (
              <div key={idx} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col items-center justify-center">
                <span className={`text-3xl font-black mb-2 ${stat.isAlert && idx === 2 ? 'text-red-600 animate-pulse' : stat.label === 'System Status' && stat.value === 'ONLINE' ? 'text-emerald-500' : 'text-indigo-950'}`}>
                  {stat.value}
                </span>
                <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>

          {/* TELEMETRY STREAMS WITH REFRESH BUTTON */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-indigo-900 tracking-wide uppercase">Telemetry Streams</h3>
              {/* --- NEW: SYNC BUTTON --- */}
              <button 
                onClick={handleSyncTelemetry}
                disabled={connectionStatus !== 'connected'}
                className="flex items-center text-xs font-bold px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50"
              >
                <span className="mr-2">🔄</span> FORCE SYNC
              </button>
            </div>
            
            {connectionStatus !== 'connected' ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300 text-slate-500">
                <span className="text-4xl mb-4 block">🔌</span>
                <p className="font-semibold text-lg text-slate-700">Hardware Link Offline</p>
                <p className="text-sm mt-1">Select a valid peripheral and tap connect to authenticate baseline configuration.</p>
              </div>
            ) : nodes.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 shadow-sm text-slate-500">
                <span className="text-4xl mb-4 block animate-bounce">📡</span>
                <p className="font-semibold text-lg text-slate-700">Awaiting Remote LoRa Signal...</p>
                <p className="text-sm mt-1">Gateway verified and online. Port active at 115200 baud.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-6">
                {nodes.map((node) => (
                  <NodeCard key={node.id} node={node} />
                ))}
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}

export default App;