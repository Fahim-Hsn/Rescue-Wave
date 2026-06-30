import React from 'react';

export default function NodeSidebar() {
  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen fixed left-0 top-0">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-100">
        <h1 className="text-2xl font-bold text-indigo-950 tracking-tight">RescueWave</h1>
        <p className="text-xs text-slate-500 mt-1 font-medium">for BAIUST</p>
        <p className="text-[10px] text-slate-400 mt-1">Coordinator Dashboard</p>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-8 overflow-y-auto">
        
        {/* OVERVIEW SECTION */}
        <div>
          <p className="text-xs font-bold text-slate-400 tracking-wider mb-3 px-2">OVERVIEW</p>
          <div className="space-y-1">
            <a href="#" className="flex items-center px-2 py-2.5 text-sm font-semibold text-indigo-900 bg-indigo-50/80 rounded-lg">
              <span className="mr-3">📊</span> Dashboard
            </a>
          </div>
        </div>

        {/* FLEET / NODES SECTION */}
        <div>
          <p className="text-xs font-bold text-slate-400 tracking-wider mb-3 px-2">NETWORK</p>
          <div className="space-y-1">
            <a href="#" className="flex items-center px-2 py-2 text-sm font-medium text-slate-500 hover:text-indigo-900 hover:bg-slate-50 rounded-lg transition-colors">
              <span className="mr-3">📡</span> Active Nodes
            </a>
            <a href="#" className="flex items-center px-2 py-2 text-sm font-medium text-slate-500 hover:text-indigo-900 hover:bg-slate-50 rounded-lg transition-colors">
              <span className="mr-3">🗺️</span> Live Map
            </a>
          </div>
        </div>

        {/* OPERATIONS SECTION */}
        <div>
          <p className="text-xs font-bold text-slate-400 tracking-wider mb-3 px-2">OPERATIONS</p>
          <div className="space-y-1">
            <a href="#" className="flex items-center px-2 py-2 text-sm font-medium text-slate-500 hover:text-indigo-900 hover:bg-slate-50 rounded-lg transition-colors">
              <span className="mr-3">🚨</span> SOS History
            </a>
            <a href="#" className="flex items-center px-2 py-2 text-sm font-medium text-slate-500 hover:text-indigo-900 hover:bg-slate-50 rounded-lg transition-colors">
              <span className="mr-3">⚙️</span> Settings
            </a>
          </div>
        </div>
      </nav>

      {/* Bottom Profile */}
      <div className="p-4 border-t border-slate-200">
        <div className="flex items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
          <div className="w-8 h-8 rounded-full bg-indigo-900 text-white flex items-center justify-center font-bold text-sm">
            F
          </div>
          <div className="ml-3">
            <p className="text-sm font-semibold text-slate-800">Fahim</p>
            <p className="text-xs text-slate-500">Coordinator</p>
          </div>
        </div>
      </div>
    </aside>
  );
}