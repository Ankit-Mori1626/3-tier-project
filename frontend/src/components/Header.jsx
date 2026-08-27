import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Boxes, 
  Activity, 
  RefreshCw, 
  Server, 
  Database, 
  ExternalLink,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

export default function Header({ onToggleMobileMenu }) {
  const { 
    healthStatus, 
    probeHealth, 
    apiUrl, 
    items, 
    clusterNodes,
    isFallbackMode 
  } = useApp();

  const [probing, setProbing] = useState(false);

  const handleManualProbe = async () => {
    setProbing(true);
    await probeHealth(false);
    setTimeout(() => setProbing(false), 500);
  };

  const getStatusBadge = () => {
    if (healthStatus.state === 'connected') {
      return (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-400 beacon-online" />
          <span>Django Backend Active</span>
          <span className="text-[11px] px-1.5 py-0.5 rounded bg-emerald-950/60 font-mono text-emerald-300">
            {healthStatus.latency}ms
          </span>
        </div>
      );
    }
    if (healthStatus.state === 'checking') {
      return (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold">
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
          <span>Probing Cluster...</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold">
        <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
        <span>Offline Local Cache</span>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950/60 font-mono text-amber-300">
          Sync Ready
        </span>
      </div>
    );
  };

  return (
    <header className="sticky top-0 z-30 w-full bg-[#0a0d14]/85 backdrop-blur-xl border-b border-slate-800/80 px-4 lg:px-8 py-3.5 flex items-center justify-between">
      {/* Left: Branding */}
      <div className="flex items-center gap-3">
        <div className="relative group flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-indigo-600 to-purple-600 p-[1px] shadow-lg shadow-cyan-500/20">
          <div className="w-full h-full bg-[#0d121f] rounded-xl flex items-center justify-center group-hover:bg-transparent transition-colors duration-300">
            <Boxes className="w-5 h-5 text-cyan-400 group-hover:text-white transition-colors" />
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base lg:text-lg font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-cyan-300 bg-clip-text text-transparent">
              K8s 3-Tier Console
            </h1>
            <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md bg-cyan-500/10 border border-cyan-500/30 text-cyan-300">
              v1.28.2
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-mono hidden md:block">
            Terraform • kubeadm (1M+3W) • Django REST • React
          </p>
        </div>
      </div>

      {/* Center: Live Cluster Telemetry pills */}
      <div className="hidden xl:flex items-center gap-4 text-xs text-slate-300">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800">
          <Server className="w-3.5 h-3.5 text-cyan-400" />
          <span>Nodes: <strong className="text-white font-mono">{clusterNodes.length}/4 Ready</strong></span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800">
          <Database className="w-3.5 h-3.5 text-indigo-400" />
          <span>Items in DB: <strong className="text-white font-mono">{items.length}</strong></span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Flannel CNI: <strong className="text-emerald-400">Healthy</strong></span>
        </div>
      </div>

      {/* Right: Health Badge & Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {getStatusBadge()}

        <button
          onClick={handleManualProbe}
          disabled={probing}
          title="Run immediate health probe"
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-400 transition-all hover:shadow-lg hover:shadow-cyan-500/10 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${probing ? 'animate-spin text-cyan-400' : ''}`} />
        </button>

        {/* Quick NodePort link pill */}
        <a
          href={apiUrl}
          target="_blank"
          rel="noreferrer"
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold hover:bg-indigo-500/20 hover:text-indigo-200 transition-all"
        >
          <span>API :30800</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </header>
  );
}
