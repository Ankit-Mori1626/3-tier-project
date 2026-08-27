import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { 
  ScrollText, 
  Trash2, 
  Download, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  XCircle,
  Play,
  Terminal,
  RefreshCw,
  Boxes,
  Layers,
  Activity
} from 'lucide-react';

export default function LogsTab() {
  const { logs, clearLogs, addLog, addToast, clusterEvents, fetchEvents, loadingEvents } = useApp();
  const [activeSubTab, setActiveSubTab] = useState('events'); // 'events' | 'logs'
  const [filterLevel, setFilterLevel] = useState('ALL');
  const [search, setSearch] = useState('');

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchLevel = filterLevel === 'ALL' || log.level === filterLevel;
      const matchSearch = 
        log.message.toLowerCase().includes(search.toLowerCase()) ||
        log.source.toLowerCase().includes(search.toLowerCase());
      return matchLevel && matchSearch;
    });
  }, [logs, filterLevel, search]);

  const filteredK8sEvents = useMemo(() => {
    return (clusterEvents || []).filter(ev => {
      const matchType = filterLevel === 'ALL' || ev.type.toUpperCase() === filterLevel.toUpperCase();
      const matchSearch = 
        ev.message.toLowerCase().includes(search.toLowerCase()) ||
        ev.reason.toLowerCase().includes(search.toLowerCase()) ||
        ev.involvedObject.toLowerCase().includes(search.toLowerCase()) ||
        ev.namespace.toLowerCase().includes(search.toLowerCase());
      return matchType && matchSearch;
    });
  }, [clusterEvents, filterLevel, search]);

  const handleExport = () => {
    const dataToExport = activeSubTab === 'events' ? clusterEvents : logs;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dataToExport, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `k8s_${activeSubTab}_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    addToast('Logs Exported', `${activeSubTab === 'events' ? 'K8s Events' : 'Activity Logs'} downloaded.`, 'success');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-white tracking-tight">
              Cluster Events & Telemetry Stream
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              {activeSubTab === 'events' ? `${filteredK8sEvents.length} K8s Events` : `${filteredLogs.length} System Logs`}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time feed of Kubernetes control plane events, deployment scheduling, and database queries.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeSubTab === 'events' && (
            <button
              onClick={fetchEvents}
              disabled={loadingEvents}
              className="px-3.5 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 hover:bg-cyan-500/20 text-cyan-400 text-xs font-semibold transition-all flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingEvents ? 'animate-spin' : ''}`} />
              <span>Sync K8s Events</span>
            </button>
          )}

          <button
            onClick={handleExport}
            className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-all flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* Filter & Subtab Controls */}
      <div className="p-4 rounded-2xl bg-[#111726]/80 border border-slate-800 backdrop-blur-md flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-xl">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
          <button
            onClick={() => setActiveSubTab('events')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeSubTab === 'events'
                ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Real K8s Events ({clusterEvents.length})
          </button>
          <button
            onClick={() => setActiveSubTab('logs')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeSubTab === 'logs'
                ? 'bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Operational Activity Logs ({logs.length})
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Level Filter */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300">
            <Filter className="w-3.5 h-3.5 text-cyan-400" />
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
              aria-label="Filter events by level"
              className="bg-transparent border-none outline-none text-slate-200 font-mono text-xs cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900 text-slate-200">All Levels</option>
              <option value="NORMAL" className="bg-slate-900 text-slate-200">Normal / Info</option>
              <option value="WARNING" className="bg-slate-900 text-slate-200">Warning</option>
              <option value="ERROR" className="bg-slate-900 text-slate-200">Error</option>
            </select>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search message, object, namespace..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-200 placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-500/50"
            />
          </div>
        </div>
      </div>

      {/* 1. REAL KUBERNETES EVENTS */}
      {activeSubTab === 'events' && (
        <div className="rounded-3xl bg-[#0d121f]/90 border border-slate-800 overflow-hidden shadow-2xl">
          <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-xs font-bold text-slate-300">
            <span className="flex items-center gap-2">
              <Boxes className="w-4 h-4 text-cyan-400" />
              <span>Kubernetes API Server Event Stream</span>
            </span>
            <span className="font-mono text-slate-500 text-[11px]">v1.list_event_for_all_namespaces()</span>
          </div>

          <div className="divide-y divide-slate-800/60 max-h-[600px] overflow-y-auto font-mono text-xs">
            {filteredK8sEvents.length > 0 ? (
              filteredK8sEvents.map((ev, idx) => (
                <div key={idx} className="p-4 hover:bg-slate-900/40 transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                  <div className="space-y-1 max-w-3xl">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        ev.type === 'Warning'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}>
                        {ev.type}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                        {ev.involvedObject}
                      </span>
                      <span className="text-[11px] text-slate-400">ns: {ev.namespace}</span>
                      <span className="text-[11px] font-semibold text-slate-300">[{ev.reason}]</span>
                    </div>
                    <p className="text-slate-200 text-xs font-sans leading-relaxed pt-0.5">
                      {ev.message}
                    </p>
                  </div>

                  <div className="text-right text-[11px] text-slate-500 whitespace-nowrap shrink-0">
                    <div>{ev.lastTimestamp ? new Date(ev.lastTimestamp).toLocaleTimeString() : 'Recent'}</div>
                    <div className="text-[10px] text-slate-600">by {ev.source}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center text-slate-400 text-xs space-y-2">
                <p>No Kubernetes events found matching current criteria.</p>
                <p className="text-slate-500">Live events will stream here automatically as controllers schedule pods.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. OPERATIONAL ACTIVITY LOGS */}
      {activeSubTab === 'logs' && (
        <div className="rounded-3xl bg-[#0d121f]/90 border border-slate-800 overflow-hidden shadow-2xl">
          <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-xs font-bold text-slate-300">
            <span className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-400" />
              <span>Full Application & Cluster Activity</span>
            </span>
            <button
              onClick={clearLogs}
              className="text-rose-400 hover:text-rose-300 font-normal flex items-center gap-1 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Log Buffer</span>
            </button>
          </div>

          <div className="divide-y divide-slate-800/60 max-h-[600px] overflow-y-auto font-mono text-xs">
            {filteredLogs.length > 0 ? (
              filteredLogs.map((log) => (
                <div key={log.id} className="p-3.5 hover:bg-slate-900/40 transition-colors flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="text-slate-500 text-[11px] shrink-0 pt-0.5">{log.timestamp}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold shrink-0 bg-slate-900 border border-slate-800 text-slate-300">
                      {log.source}
                    </span>
                    <span className="text-slate-200 truncate">{log.message}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs">
                No activity logs in buffer.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
