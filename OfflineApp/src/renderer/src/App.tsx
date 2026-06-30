import React from 'react';
import NodeSidebar from './components/NodeSidebar';
import NodeCard from './components/NodeCard';
import { NodeTelemetry } from '../../shared/gateway-node';

// ডামি ডেটা: হার্ডওয়্যার কানেক্ট করার আগ পর্যন্ত ডিজাইন চেক করার জন্য
const dummyNodes: NodeTelemetry[] = [
  {
    id: 'NODE-1',
    lat: 23.4567,
    lng: 91.1234,
    temperature: 32.5,
    humidity: 80,
    waterLevel: 12,
    motionDetected: false,
    sosStatus: 'OK',
    lastSeen: Date.now()
  },
  {
    id: 'NODE-2',
    lat: 23.4570,
    lng: 91.1240,
    temperature: 31.0,
    humidity: 85,
    waterLevel: 45,
    motionDetected: true,
    sosStatus: 'SOS',
    lastSeen: Date.now()
  }
];

function App(): JSX.Element {
  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900">
      {/* Sidebar */}
      <NodeSidebar />

      {/* Main Content */}
      <main className="flex-1 ml-64 overflow-y-auto">
        <header className="px-8 py-6 flex justify-between items-center border-b border-slate-200 bg-white/50 backdrop-blur-sm sticky top-0 z-10">
          <div>
            <h2 className="text-2xl font-bold text-indigo-950">System Overview</h2>
            <p className="text-sm text-slate-500 mt-1">Real-time disaster area telemetry</p>
          </div>
          <button className="bg-indigo-950 text-white px-5 py-2.5 rounded-lg text-sm font-semibold shadow-sm hover:bg-indigo-900 transition-colors">
            + ADD NODE
          </button>
        </header>

        <div className="p-8">
          
          {/* Top Stats Row (Like the image) */}
          <div className="grid grid-cols-4 gap-6 mb-10">
            {[
              { label: 'Total Nodes', value: '2' },
              { label: 'Active Nodes', value: '2' },
              { label: 'SOS Alerts', value: '1', isAlert: true },
              { label: 'Offline', value: '0' }
            ].map((stat, idx) => (
              <div key={idx} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col items-center justify-center">
                <span className={`text-4xl font-bold mb-2 ${stat.isAlert ? 'text-red-600' : 'text-indigo-950'}`}>
                  {stat.value}
                </span>
                <span className="text-xs font-semibold text-slate-400 tracking-wider uppercase">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>

          {/* Node Cards Grid */}
          <div>
            <h3 className="text-sm font-bold text-indigo-900 mb-4 tracking-wide uppercase">Connected Nodes ({dummyNodes.length})</h3>
            <div className="grid grid-cols-2 gap-6">
              {dummyNodes.map(node => (
                <NodeCard key={node.id} node={node} />
              ))}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

export default App;