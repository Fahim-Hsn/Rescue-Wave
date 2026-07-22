// File Location: OfflineApp/src/renderer/src/components/NodeSidebar.tsx
import { useState } from 'react';

interface SidebarProps {
  onScrollToMap: () => void;
  onScrollToNodes: () => void;
  onOpenSettings: () => void;
  onOpenHistory: () => void;
  onOpenHumanHistory: () => void;
  onOpenLogs: () => void;
  onOpenUsers: () => void; // NEW: Open User Management
  onExportCSV: () => void;
  onExportHistory: () => void;
  onExportHumanHistory: () => void;
  currentUser: string;
  isAdmin: boolean; // NEW: Check if Admin
  onLogout: () => void;
}

export default function NodeSidebar({ 
  onScrollToMap, 
  onScrollToNodes, 
  onOpenSettings, 
  onOpenHistory,
  onOpenHumanHistory,
  onOpenLogs, 
  onOpenUsers,
  onExportCSV, 
  onExportHistory,
  onExportHumanHistory,
  currentUser,
  isAdmin,
  onLogout
}: SidebarProps) {
  
  const [exportOpen, setExportOpen] = useState(false);

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col fixed h-full z-20 shadow-sm">
      <div className="p-6">
        <h1 className="text-2xl font-black text-indigo-950 tracking-tight">RescueWave</h1>
        <p className="text-xs text-slate-500 font-semibold mt-1">for BAIUST</p>
        <p className="text-[10px] text-slate-400 mt-0.5">Coordinator Dashboard</p>
      </div>

      <nav className="flex-1 px-4 space-y-6 mt-2 overflow-y-auto">
        
        <div>
          <p className="px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Overview</p>
          <button className="w-full flex items-center px-2 py-2 bg-indigo-50 text-indigo-700 rounded-lg font-bold text-sm">
            <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
            Dashboard
          </button>
        </div>

        <div>
          <p className="px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Network</p>
          <button onClick={onScrollToNodes} className="w-full flex items-center px-2 py-2 text-slate-600 hover:bg-slate-50 hover:text-indigo-700 rounded-lg font-semibold text-sm transition-colors">
            <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Active Nodes
          </button>
          <button onClick={onScrollToMap} className="w-full flex items-center px-2 py-2 text-slate-600 hover:bg-slate-50 hover:text-indigo-700 rounded-lg font-semibold text-sm transition-colors">
            <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
            Live Map
          </button>
        </div>

        <div>
          <p className="px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Operations</p>
          <button onClick={onOpenHistory} className="w-full flex items-center px-2 py-2 text-slate-600 hover:bg-slate-50 hover:text-indigo-700 rounded-lg font-semibold text-sm transition-colors">
            <svg className="w-4 h-4 mr-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            SOS History
          </button>
          <button onClick={onOpenHumanHistory} className="w-full flex items-center px-2 py-2 text-slate-600 hover:bg-slate-50 hover:text-indigo-700 rounded-lg font-semibold text-sm transition-colors">
            <svg className="w-4 h-4 mr-3 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            Motion History
          </button>
          <button onClick={onOpenSettings} className="w-full flex items-center px-2 py-2 text-slate-600 hover:bg-slate-50 hover:text-indigo-700 rounded-lg font-semibold text-sm transition-colors">
            <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            Settings
          </button>
          <button onClick={onOpenLogs} className="w-full flex items-center px-2 py-2 text-slate-600 hover:bg-slate-50 hover:text-indigo-700 rounded-lg font-semibold text-sm transition-colors">
            <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            System Logs
          </button>
        </div>

        {/* NEW: ONLY ADMIN CAN SEE THIS SECTION */}
        {isAdmin && (
          <div>
            <p className="px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Admin Tools</p>
            <button onClick={onOpenUsers} className="w-full flex items-center px-2 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg font-bold text-sm transition-colors">
              <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              Manage Volunteers
            </button>
          </div>
        )}

        <div>
          <p className="px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Data Management</p>
          <div className="relative">
            <button onClick={() => setExportOpen(!exportOpen)} className="w-full flex items-center justify-between px-2 py-2 text-slate-600 hover:bg-slate-50 hover:text-indigo-700 rounded-lg font-semibold text-sm transition-colors">
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                Export Data
              </div>
              <svg className={`w-4 h-4 transition-transform ${exportOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
            {exportOpen && (
              <div className="mt-1 ml-4 border-l-2 border-slate-100 pl-2 space-y-1">
                <button onClick={onExportCSV} className="w-full text-left px-2 py-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded">Export Live Data</button>
                <button onClick={onExportHistory} className="w-full text-left px-2 py-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded">Export SOS History</button>
                <button onClick={onExportHumanHistory} className="w-full text-left px-2 py-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded">Export Motion History</button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <div className="p-4 border-t border-slate-200">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full text-white flex items-center justify-center font-bold text-sm uppercase ${isAdmin ? 'bg-rose-600' : 'bg-indigo-950'}`}>
              {currentUser ? currentUser.charAt(0) : 'U'}
            </div>
            <div className="ml-3">
              <p className="text-sm font-bold text-slate-800">{currentUser || 'User'}</p>
              <p className="text-[10px] text-emerald-600 font-bold">● {isAdmin ? 'ADMIN' : 'VOLUNTEER'}</p>
            </div>
          </div>
          <button onClick={onLogout} title="Logout" className="text-slate-400 hover:text-red-500 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          </button>
        </div>
      </div>
    </aside>
  );
}