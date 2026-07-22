// File Location: OfflineApp/src/renderer/src/App.tsx
import React, { useState, useEffect, useRef } from 'react';
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
      sendSerialCommand: (command: string) => Promise<boolean>;
      exportCsv: (data: string, filename: string) => Promise<boolean>;
      saveSettings: (settings: any) => Promise<void>;
      getSettings: () => Promise<any>;
      getHistory: () => Promise<any[]>;
      getHumanHistory: () => Promise<any[]>;
    };
  }
}

export default function App() {
  // --- AUTHENTICATION STATE ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [currentUser, setCurrentUser] = useState('');
  const [loginError, setLoginError] = useState('');

  // --- DISCONNECT AUTH STATE ---
  const [showDisconnectAuth, setShowDisconnectAuth] = useState(false);
  const [disconnectPassword, setDisconnectPassword] = useState('');
  const [disconnectError, setDisconnectError] = useState('');

  // --- DASHBOARD STATE ---
  const [nodes, setNodes] = useState<NodeTelemetry[]>([]);
  const [ports, setPorts] = useState<string[]>([]);
  const [selectedPort, setSelectedPort] = useState<string>('');
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');

  const [controlNodeLocation, setControlNodeLocation] = useState<{ lat: number, lng: number }>({ lat: 23.4622, lng: 91.1370 });

  const [nodeNames, setNodeNames] = useState<Record<string, string>>({});
  const [showHistory, setShowHistory] = useState(false);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [showHumanHistory, setShowHumanHistory] = useState(false);
  const [humanHistoryData, setHumanHistoryData] = useState<any[]>([]);
  const [totalSOSCount, setTotalSOSCount] = useState(0);
  const [totalMotionCount, setTotalMotionCount] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [audioAlerts, setAudioAlerts] = useState(true);
  const [sensorStates, setSensorStates] = useState<Record<string, { radar: boolean, water: boolean }>>({});

  // --- SYSTEM LOGS STATE ---
  const [showLogs, setShowLogs] = useState(false);
  const [systemLogs, setSystemLogs] = useState<{ time: string, user: string, action: string }[]>([]);

  // Refs for smooth scrolling
  const mapSectionRef = useRef<HTMLDivElement>(null);
  const nodesSectionRef = useRef<HTMLDivElement>(null);

  // --- INITIALIZATION & EFFECTS ---

  const fetchHistoryTotals = async () => {
    const sos = await window.api.getHistory();
    const human = await window.api.getHumanHistory();
    setTotalSOSCount(sos?.length || 0);
    setTotalMotionCount(human?.length || 0);
  };

  useEffect(() => {
    const savedLogs = localStorage.getItem('rescueWaveLogs');
    if (savedLogs) setSystemLogs(JSON.parse(savedLogs));

    const savedLoc = localStorage.getItem('controlNodeLocation');
    if (savedLoc) setControlNodeLocation(JSON.parse(savedLoc));

    fetchPorts();
    window.api.getSettings().then(data => setNodeNames(data || {}));
    fetchHistoryTotals();

    window.api.onSerialData((newData: NodeTelemetry) => {
      if (newData.sosStatus === 'SOS' || newData.sosStatus === 'HUMAN') {
        fetchHistoryTotals();
      }
      setNodes((prevNodes) => {
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
      if (status === 'disconnected') setNodes([]);

      if (status === 'connected') addSystemLog("System", "Hardware connected to COM port.");
      if (status === 'disconnected') addSystemLog("System", "Hardware disconnected.");
    });
  }, []);

  // --- HELPER: SYSTEM LOG TRACKER ---
  const addSystemLog = (user: string, action: string) => {
    const newLog = { time: new Date().toLocaleTimeString() + ' ' + new Date().toLocaleDateString(), user, action };
    setSystemLogs(prev => {
      const updated = [newLog, ...prev].slice(0, 100);
      localStorage.setItem('rescueWaveLogs', JSON.stringify(updated));
      return updated;
    });
  };

  // --- LOGIN LOGIC ---
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (usernameInput.trim() !== '' && passwordInput === '1234') {
      setIsAuthenticated(true);
      setCurrentUser(usernameInput.trim());
      setLoginError('');
      addSystemLog(usernameInput.trim(), "Logged into the dashboard.");
    } else {
      setLoginError('Invalid credentials. Hint: pass is 1234');
    }
  };

  const handleLogout = () => {
    addSystemLog(currentUser, "Logged out of the dashboard.");
    setIsAuthenticated(false);
    setUsernameInput('');
    setPasswordInput('');
  };

  // --- DISCONNECT LOGIC ---
  const initiateDisconnect = () => {
    setDisconnectPassword('');
    setDisconnectError('');
    setShowDisconnectAuth(true);
  };

  const confirmDisconnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (disconnectPassword === '1234') {
      await window.api.disconnectPort();
      setNodes([]);
      setShowDisconnectAuth(false);
      addSystemLog(currentUser, "Authorized manual hardware disconnect.");
    } else {
      setDisconnectError('Invalid PIN.');
    }
  };

  // --- DASHBOARD HANDLERS ---
  const fetchPorts = async () => {
    const availablePorts = await window.api.getPorts();
    setPorts(availablePorts);
    if (availablePorts.length > 0 && !selectedPort) setSelectedPort(availablePorts[0]);
  };

  const handleConnect = async () => {
    if (!selectedPort) return;
    setConnectionStatus('connecting');
    setNodes([]);
    await window.api.connectPort(selectedPort);
  };

  const handleScrollToMap = () => mapSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const handleScrollToNodes = () => nodesSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const handleOpenHistory = async () => {
    const data = await window.api.getHistory();
    setHistoryData(data);
    setShowHistory(true);
  };

  const handleOpenHumanHistory = async () => {
    const data = await window.api.getHumanHistory();
    setHumanHistoryData(data);
    setShowHumanHistory(true);
  };

  const handleExportCSV = async () => {
    if (nodes.length === 0) return alert("No active nodes to export.");
    let csv = "Time,Node ID,Custom Name,Status,Latitude,Longitude,Temperature(C),Water Level(cm)\n";
    nodes.forEach(n => {
      csv += `"${new Date().toLocaleTimeString()}","${n.id}","${nodeNames[n.id] || 'Unassigned'}","${n.sosStatus}","${n.lat}","${n.lng}","${n.temperature}","${n.waterLevel}"\n`;
    });
    const success = await window.api.exportCsv(csv, `RescueWave_Live_Data_${Date.now()}.csv`);
    if (success) addSystemLog(currentUser, "Exported Live Data CSV.");
  };

  const handleExportHistory = async () => {
    const data = await window.api.getHistory();
    if (!data || data.length === 0) return alert("No SOS history to export.");
    let csv = "Timestamp,Node ID,Latitude,Longitude\n";
    data.forEach(h => {
      csv += `"${h.time}","${h.node}","${h.lat}","${h.lng}"\n`;
    });
    const success = await window.api.exportCsv(csv, `RescueWave_SOS_History_${Date.now()}.csv`);
    if (success) addSystemLog(currentUser, "Exported SOS History CSV.");
  };

  const handleExportHumanHistory = async () => {
    const data = await window.api.getHumanHistory();
    if (!data || data.length === 0) return alert("No human detection history to export.");
    let csv = "Timestamp,Node ID,Latitude,Longitude\n";
    data.forEach(h => {
      csv += `"${h.time}","${h.node}","${h.lat}","${h.lng}"\n`;
    });
    const success = await window.api.exportCsv(csv, `RescueWave_Human_History_${Date.now()}.csv`);
    if (success) addSystemLog(currentUser, "Exported Human Detection History CSV.");
  };

  const handleSaveNodeName = (id: string, newName: string) => {
    const oldName = nodeNames[id] || id;
    const updated = { ...nodeNames, [id]: newName };
    setNodeNames(updated);
    window.api.saveSettings(updated);
    addSystemLog(currentUser, `Changed node ${id} name from "${oldName}" to "${newName}".`);
  };

  const handleSaveControlNodeLocation = (lat: number, lng: number) => {
    const loc = { lat, lng };
    setControlNodeLocation(loc);
    localStorage.setItem('controlNodeLocation', JSON.stringify(loc));
    addSystemLog(currentUser, `Updated Control Node Location to ${lat}, ${lng}`);
  };

  const handleClearDashboard = () => {
    if (confirm("Are you sure you want to clear live dashboard data?")) {
      setNodes([]);
      addSystemLog(currentUser, "Cleared Live Dashboard data.");
    }
  };

  const handleToggleSensor = async (nodeId: string, sensor: 'RADAR' | 'WATER', currentState: boolean) => {
    const newState = !currentState;
    const command = `CMD,${nodeId},${sensor},${newState ? 'ON' : 'OFF'}`;

    await window.api.sendSerialCommand(command);

    setSensorStates(prev => ({
      ...prev,
      [nodeId]: {
        ...(prev[nodeId] || { radar: true, water: true }),
        [sensor.toLowerCase() as 'radar' | 'water']: newState
      }
    }));

    addSystemLog(currentUser, `Sent remote command: Turned ${sensor} ${newState ? 'ON' : 'OFF'} for ${nodeId}`);
  };

  // --- RENDER LOGIN SCREEN ---
  // --- RENDER LOGIN SCREEN (Updated with Video Background) ---
  if (!isAuthenticated) {
    return (
      <div className="relative h-screen w-full flex items-center justify-center overflow-hidden font-sans">
        {/* Video Background */}
        <video
          autoPlay
          loop
          muted
          className="absolute inset-0 w-full h-full object-cover z-0"
        >
          <source src="./background.mp4" type="video/mp4" />
        </video>

        {/* Dark Overlay for better contrast */}
        <div className="absolute inset-0 bg-black/50 z-10"></div>

        {/* Login Card (Glassmorphism effect) */}
        <div className="relative z-20 bg-white/10 backdrop-blur-md p-10 rounded-3xl shadow-2xl border border-white/20 w-[400px]">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-black text-white tracking-tight mb-2">RescueWave</h1>
            <p className="text-sm text-indigo-100 font-semibold uppercase tracking-widest">Coordinator Access</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-[10px] font-bold text-white uppercase tracking-wider mb-2">Username</label>
              <input
                type="text"
                required
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-white/20 bg-white/10 text-white placeholder-white/50 focus:outline-none focus:border-indigo-400 font-semibold"
                placeholder="e.g. Fahim Hossain"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-white uppercase tracking-wider mb-2">PIN / Password</label>
              <input
                type="password"
                required
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-white/20 bg-white/10 text-white placeholder-white/50 focus:outline-none focus:border-indigo-400 font-semibold"
                placeholder="••••"
              />
            </div>
            {loginError && <p className="text-rose-300 text-xs font-bold text-center bg-rose-900/50 py-2 rounded">{loginError}</p>}
            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-4 rounded-lg shadow-lg transition-all transform hover:scale-[1.02]">
              Access Dashboard
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Apply local sensor overrides to incoming telemetry
  const processedNodes = nodes.map(node => {
    // If the radar toggle is OFF, suppress HUMAN detection alerts
    if (node.sosStatus === 'HUMAN' && sensorStates[node.id]?.radar === false) {
      return { ...node, sosStatus: 'SAFE' as const };
    }
    return node;
  });

  const activeNodesCount = processedNodes.length;
  const sosAlertsCount = processedNodes.filter(n => n.sosStatus === 'SOS').length;
  const humanAlertsCount = processedNodes.filter(n => n.sosStatus === 'HUMAN').length;

  return (
    <div className="flex h-screen w-full bg-slate-50 font-sans text-slate-900 overflow-hidden">

      {/* 4. DISCONNECT AUTH MODAL */}
      {showDisconnectAuth && (
        <div className="fixed inset-0 bg-slate-900/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-[350px] shadow-2xl p-6">
            <h2 className="text-lg font-bold text-rose-600 mb-2">Confirm Disconnect</h2>
            <p className="text-xs text-slate-500 mb-5">Enter PIN to authorize hardware disconnection.</p>
            <form onSubmit={confirmDisconnect}>
              <input
                type="password"
                autoFocus
                required
                value={disconnectPassword}
                onChange={(e) => setDisconnectPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 font-semibold text-slate-700 bg-slate-50 mb-3"
                placeholder="••••"
              />
              {disconnectError && <p className="text-rose-500 text-xs font-semibold mb-3">{disconnectError}</p>}
              <div className="flex space-x-3">
                <button type="button" onClick={() => setShowDisconnectAuth(false)} className="flex-1 px-4 py-2 bg-slate-100 text-slate-600 font-bold rounded-lg hover:bg-slate-200 text-sm transition-colors">
                  Cancel
                </button>
                <button type="submit" className="flex-1 px-4 py-2 bg-rose-600 text-white font-bold rounded-lg hover:bg-rose-700 text-sm transition-colors">
                  Disconnect
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 1. SETTINGS MODAL */}
      {showSettings && (
        <div className="fixed inset-0 bg-indigo-950/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-[550px] overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
            <div className="bg-indigo-900 px-6 py-4 flex justify-between items-center shrink-0">
              <h2 className="text-white font-bold text-lg flex items-center">⚙️ System Settings</h2>
              <button onClick={() => setShowSettings(false)} className="text-indigo-200 hover:text-white text-xl">✕</button>
            </div>
            <div className="p-6 overflow-y-auto">
              <div className="mb-8">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b pb-2">App Preferences</h3>
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <p className="font-bold text-slate-800 text-sm">Dashboard Audio Alerts</p>
                    <p className="text-xs text-slate-500">Play sounds when SOS is received</p>
                  </div>
                  <button onClick={() => setAudioAlerts(!audioAlerts)} className={`w-12 h-6 rounded-full relative transition-colors ${audioAlerts ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                    <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${audioAlerts ? 'left-7' : 'left-1'}`}></div>
                  </button>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-bold text-slate-800 text-sm">Clear Live Dashboard</p>
                    <p className="text-xs text-slate-500">Removes all currently visible nodes</p>
                  </div>
                  <button onClick={handleClearDashboard} className="px-3 py-1.5 bg-rose-100 text-rose-700 font-bold text-xs rounded hover:bg-rose-200">Clear Data</button>
                </div>
              </div>
              <div className="mb-8">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b pb-2">Control Node Location</h3>
                <div className="flex justify-between items-center mb-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <span className="font-bold text-indigo-950 text-sm">Operation Node Location</span>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      step="any"
                      placeholder="Lat"
                      value={controlNodeLocation.lat}
                      onChange={(e) => handleSaveControlNodeLocation(parseFloat(e.target.value) || 0, controlNodeLocation.lng)}
                      className="border border-slate-300 rounded-md px-3 py-1.5 w-24 text-sm focus:outline-indigo-500 focus:border-indigo-500 font-semibold text-slate-700"
                    />
                    <input
                      type="number"
                      step="any"
                      placeholder="Lng"
                      value={controlNodeLocation.lng}
                      onChange={(e) => handleSaveControlNodeLocation(controlNodeLocation.lat, parseFloat(e.target.value) || 0)}
                      className="border border-slate-300 rounded-md px-3 py-1.5 w-24 text-sm focus:outline-indigo-500 focus:border-indigo-500 font-semibold text-slate-700"
                    />
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b pb-2">Node Name Configuration</h3>
                {nodes.length === 0 ? (
                  <p className="text-center text-slate-500 py-2 text-sm italic">Connect hardware to assign names to active nodes.</p>
                ) : (
                  nodes.map(n => (
                    <div key={n.id} className="flex justify-between items-center mb-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <span className="font-bold text-indigo-950 flex items-center">{n.id}</span>
                      <input
                        type="text"
                        placeholder="Enter location name..."
                        value={nodeNames[n.id] || ''}
                        onChange={(e) => handleSaveNodeName(n.id, e.target.value)}
                        className="border border-slate-300 rounded-md px-3 py-1.5 w-48 text-sm focus:outline-indigo-500 focus:border-indigo-500 font-semibold text-slate-700"
                      />
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. HISTORY MODAL */}
      {showHistory && (
        <div className="fixed inset-0 bg-red-950/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-[700px] max-h-[80vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="bg-red-600 px-6 py-4 flex justify-between items-center">
              <h2 className="text-white font-bold text-lg flex items-center">SOS Alert History</h2>
              <button onClick={() => setShowHistory(false)} className="text-red-200 hover:text-white text-xl">✕</button>
            </div>
            <div className="p-0 overflow-y-auto flex-1">
              {historyData.length === 0 ? (
                <p className="text-center text-slate-500 py-10">No SOS events recorded yet.</p>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 sticky top-0">
                    <tr className="border-b border-slate-200 text-xs uppercase text-slate-500 tracking-wider">
                      <th className="py-3 px-6">Timestamp</th>
                      <th className="py-3 px-6">Node ID</th>
                      <th className="py-3 px-6">Coordinates (Lat, Lng)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyData.map((h, i) => (
                      <tr key={h.id || i} className="border-b border-slate-100 text-sm hover:bg-slate-50">
                        <td className="py-4 px-6 font-semibold text-slate-700">{h.time}</td>
                        <td className="py-4 px-6 font-black text-red-600">{h.node}</td>
                        <td className="py-4 px-6 text-slate-500 font-mono text-xs">{h.lat}, {h.lng}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* HUMAN DETECTION HISTORY MODAL */}
      {showHumanHistory && (
        <div className="fixed inset-0 bg-orange-950/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-[700px] max-h-[80vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="bg-orange-500 px-6 py-4 flex justify-between items-center">
              <h2 className="text-white font-bold text-lg flex items-center">Human Detected History</h2>
              <button onClick={() => setShowHumanHistory(false)} className="text-orange-200 hover:text-white text-xl">✕</button>
            </div>
            <div className="p-0 overflow-y-auto flex-1">
              {humanHistoryData.length === 0 ? (
                <p className="text-center text-slate-500 py-10">No human detection events recorded yet.</p>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 sticky top-0">
                    <tr className="border-b border-slate-200 text-xs uppercase text-slate-500 tracking-wider">
                      <th className="py-3 px-6">Timestamp</th>
                      <th className="py-3 px-6">Node ID</th>
                      <th className="py-3 px-6">Coordinates (Lat, Lng)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {humanHistoryData.map((h, i) => (
                      <tr key={h.id || i} className="border-b border-slate-100 text-sm hover:bg-slate-50">
                        <td className="py-4 px-6 font-semibold text-slate-700">{h.time}</td>
                        <td className="py-4 px-6 font-black text-orange-600">{h.node}</td>
                        <td className="py-4 px-6 text-slate-500 font-mono text-xs">{h.lat}, {h.lng}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. SYSTEM LOGS MODAL */}
      {showLogs && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-[700px] max-h-[80vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="bg-slate-800 px-6 py-4 flex justify-between items-center">
              <h2 className="text-white font-bold text-lg flex items-center">Activity & System Logs</h2>
              <button onClick={() => setShowLogs(false)} className="text-slate-400 hover:text-white text-xl">✕</button>
            </div>
            <div className="p-0 overflow-y-auto flex-1 bg-slate-50">
              {systemLogs.length === 0 ? (
                <p className="text-center text-slate-500 py-10">No system activities recorded yet.</p>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead className="bg-white sticky top-0 shadow-sm z-10">
                    <tr className="border-b border-slate-200 text-[10px] uppercase text-slate-400 tracking-wider">
                      <th className="py-3 px-6">Timestamp</th>
                      <th className="py-3 px-4">User</th>
                      <th className="py-3 px-6">Action Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {systemLogs.map((log, i) => (
                      <tr key={i} className="border-b border-slate-200/60 text-sm hover:bg-white transition-colors">
                        <td className="py-3 px-6 text-slate-500 font-mono text-xs">{log.time}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${log.user === 'System' ? 'bg-slate-200 text-slate-600' : 'bg-indigo-100 text-indigo-700'}`}>
                            {log.user}
                          </span>
                        </td>
                        <td className="py-3 px-6 text-slate-700 font-medium">{log.action}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SIDEBAR COMPONENT */}
      <NodeSidebar
        onScrollToMap={handleScrollToMap}
        onScrollToNodes={handleScrollToNodes}
        onOpenSettings={() => setShowSettings(true)}
        onOpenHistory={handleOpenHistory}
        onOpenHumanHistory={handleOpenHumanHistory}
        onOpenLogs={() => setShowLogs(true)}
        onOpenUsers={() => { }}
        onExportCSV={handleExportCSV}
        onExportHistory={handleExportHistory}
        onExportHumanHistory={handleExportHumanHistory}
        currentUser={currentUser}
        isAdmin={false}
        onLogout={handleLogout}
      />

      {/* FIXED: MAIN CONTENT WIDTH & SCROLLING */}
      <main className="flex-1 ml-64 h-screen overflow-y-auto overflow-x-hidden scroll-smooth flex flex-col min-w-0">

        {connectionStatus === 'error' && (
          <div className="bg-rose-600 text-white text-center py-2 text-xs font-bold tracking-wider sticky top-0 z-20 shadow-sm animate-pulse shrink-0">
            ❌ AUTHENTICATION ERROR: HARDWARE DISCONNECTED
          </div>
        )}

        {/* FIXED: HEADER WIDTH & BUTTON TEXT */}
        <header className="px-8 py-6 flex justify-between items-center border-b border-slate-200 bg-white/50 backdrop-blur-sm sticky top-0 z-10 shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-indigo-950">System Overview</h2>
            <p className="text-sm text-slate-500 mt-1">Real-time disaster area telemetry</p>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center bg-white rounded-lg border border-slate-200 shadow-sm p-1">
              <button onClick={fetchPorts} className="p-1.5 text-slate-400 hover:text-indigo-600" disabled={connectionStatus === 'connected'}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              </button>
              <div className="w-px h-5 bg-slate-200 mx-1"></div>
              <select
                className="bg-transparent border-none text-sm font-bold text-slate-700 py-1.5 pl-2 pr-6 outline-none w-32"
                value={selectedPort} onChange={(e) => setSelectedPort(e.target.value)} disabled={connectionStatus === 'connected'}
              >
                {ports.length === 0 ? <option value="">No ports</option> : ports.map(port => <option key={port} value={port}>{port}</option>)}
              </select>
            </div>

            {connectionStatus === 'connected' ? (
              <button onClick={initiateDisconnect} className="px-6 py-2.5 rounded-lg text-sm font-bold shadow-sm bg-rose-600 text-white hover:bg-rose-700 uppercase tracking-wider">
                Disconnect
              </button>
            ) : (
              <button onClick={handleConnect} disabled={!selectedPort} className="px-6 py-2.5 rounded-lg text-sm font-bold shadow-sm bg-indigo-950 text-white hover:bg-indigo-900 disabled:opacity-50 uppercase tracking-wider">
                Connect
              </button>
            )}
          </div>
        </header>

        <div className="p-8 flex-1">
          {/* MAP SECTION */}
          <div ref={mapSectionRef} className="mb-10 relative z-0 pt-4">
            <MapComponent nodes={processedNodes} nodeNames={nodeNames} controlNodeLocation={controlNodeLocation} />
          </div>

          <div className="grid grid-cols-4 gap-6 mb-10">
            {[
              { label: 'Active Nodes', value: activeNodesCount.toString() },
              { label: 'Motion Alerts', value: humanAlertsCount.toString(), isAlert: humanAlertsCount > 0, alertClass: 'text-orange-500 animate-pulse' },
              { label: 'SOS Alerts', value: sosAlertsCount.toString(), isAlert: sosAlertsCount > 0, alertClass: 'text-red-600 animate-pulse' },
              { label: 'System Status', value: connectionStatus === 'connected' ? 'ONLINE' : 'OFFLINE', isAlert: connectionStatus !== 'connected', alertClass: 'text-rose-600' }
            ].map((stat, idx) => (
              <div key={idx} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col items-center justify-center">
                <span className={`text-3xl font-black mb-2 ${stat.isAlert && stat.alertClass ? stat.alertClass : stat.label === 'System Status' && stat.value === 'ONLINE' ? 'text-emerald-500' : 'text-indigo-950'}`}>
                  {stat.value}
                </span>
                <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">{stat.label}</span>
              </div>
            ))}
          </div>

          {/* NODES SECTION */}
          <div ref={nodesSectionRef} className="pt-4 pb-20">
            {/* HISTORY TOTALS CARDS */}
            <div className="grid grid-cols-2 gap-6 mb-8">
              {[
                { label: 'Total SOS History', value: totalSOSCount.toString(), textClass: 'text-red-600' },
                { label: 'Total Motion History', value: totalMotionCount.toString(), textClass: 'text-orange-500' }
              ].map((stat, idx) => (
                <div key={idx} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col items-center justify-center">
                  <span className={`text-3xl font-black mb-2 ${stat.textClass}`}>
                    {stat.value}
                  </span>
                  <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">{stat.label}</span>
                </div>
              ))}
            </div>

            <h3 className="text-sm font-bold text-indigo-900 mb-4 tracking-wide uppercase">Telemetry Streams</h3>
            {connectionStatus !== 'connected' ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300 text-slate-500">
                <svg className="w-10 h-10 mx-auto text-slate-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                <p className="font-semibold text-lg text-slate-700">Hardware Link Offline</p>
                <p className="text-sm mt-1">Select a valid peripheral and connect.</p>
              </div>
            ) : processedNodes.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 shadow-sm text-slate-500">
                <svg className="w-10 h-10 mx-auto text-indigo-300 mb-3 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" /></svg>
                <p className="font-semibold text-lg text-slate-700">Awaiting Remote LoRa Signal...</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-6">
                {processedNodes.map((node) => (
                  <NodeCard
                    key={node.id}
                    node={{ ...node, id: nodeNames[node.id] ? `${nodeNames[node.id]} (${node.id})` : node.id }}
                    rawId={node.id}
                    sensorStates={sensorStates[node.id] || { radar: true, water: true }}
                    onToggleSensor={handleToggleSensor}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}