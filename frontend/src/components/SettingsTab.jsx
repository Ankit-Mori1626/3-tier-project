import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Settings, 
  Server, 
  Database, 
  RefreshCw, 
  ShieldCheck, 
  Save, 
  Trash2, 
  Sparkles,
  Sliders,
  ExternalLink,
  Code,
  HardDrive
} from 'lucide-react';

export default function SettingsTab() {
  const { 
    apiUrl, 
    setApiUrl, 
    autoPing, 
    setAutoPing, 
    pingIntervalSeconds, 
    setPingIntervalSeconds,
    probeHealth,
    addToast,
    triggerConfetti
  } = useApp();

  const [inputUrl, setInputUrl] = useState(apiUrl);
  const [saved, setSaved] = useState(false);

  const handleSaveUrl = (e) => {
    e.preventDefault();
    if (!inputUrl.trim()) return;
    setApiUrl(inputUrl.trim());
    setSaved(true);
    probeHealth(false);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleResetCache = () => {
    if (window.confirm('Reset local cache data to default initial state?')) {
      localStorage.removeItem('k8s_app_items_cache');
      window.location.reload();
    }
  };

  const handleSeedData = () => {
    const demoItems = [
      {
        id: Date.now() + 1,
        name: "Grafana & Prometheus Monitoring",
        description: "Cluster node-exporter metrics, Grafana dashboards on NodePort 31000.",
        category: "Infrastructure",
        priority: "High",
        status: "active"
      },
      {
        id: Date.now() + 2,
        name: "Cert-Manager Let's Encrypt Issuer",
        description: "Automated ACME DNS-01 certificate renewals for cluster domains.",
        category: "Security",
        priority: "Critical",
        status: "active"
      },
      {
        id: Date.now() + 3,
        name: "Redis Replication Cluster",
        description: "Leader-follower Redis sentinel for caching Django ORM session data.",
        category: "Database",
        priority: "Medium",
        status: "active"
      }
    ];

    try {
      const raw = localStorage.getItem('k8s_app_items_cache');
      const existing = raw ? JSON.parse(raw) : [];
      localStorage.setItem('k8s_app_items_cache', JSON.stringify([...demoItems, ...existing]));
      triggerConfetti();
      addToast('Sample Data Added', 'Seeded 3 new cluster items to local state.', 'success');
      setTimeout(() => window.location.reload(), 600);
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-black text-white tracking-tight">
            System & Environment Configuration
          </h2>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
            Control Plane
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Configure API connection endpoints, health-check timers, and local persistent data caching.
        </p>
      </div>

      {/* Backend API Configuration */}
      <div className="p-6 rounded-3xl bg-[#111726]/80 border border-slate-800/90 backdrop-blur-xl shadow-xl space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Server className="w-5 h-5 text-cyan-400" />
          <span>Django Backend Target URL</span>
        </h3>
        <p className="text-xs text-slate-400">
          Point the frontend to your local dev server or live EC2 Master / Worker NodePort (<code className="text-cyan-300 font-mono">:30800</code>).
        </p>

        <form onSubmit={handleSaveUrl} className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="http://localhost:8000 or http://<master_ip>:30800"
              className="flex-1 px-4 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-slate-100 font-mono text-sm focus:outline-none focus:border-cyan-400"
            />
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-bold text-sm shadow-lg shadow-cyan-500/25 transition-all flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{saved ? 'Saved!' : 'Update Target'}</span>
            </button>
          </div>

          {/* Preset Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
            <span className="text-slate-500 font-semibold uppercase text-[10px]">Presets:</span>
            <button
              type="button"
              onClick={() => {
                setInputUrl('http://localhost:8000');
                setApiUrl('http://localhost:8000');
                probeHealth(false);
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-cyan-300 font-mono text-[11px]"
            >
              Local Docker (:8000)
            </button>
            <button
              type="button"
              onClick={() => {
                setInputUrl('http://127.0.0.1:8000');
                setApiUrl('http://127.0.0.1:8000');
                probeHealth(false);
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-cyan-300 font-mono text-[11px]"
            >
              127.0.0.1:8000
            </button>
          </div>
        </form>
      </div>

      {/* Auto-Ping & Telemetry Settings */}
      <div className="p-6 rounded-3xl bg-[#111726]/80 border border-slate-800/90 backdrop-blur-xl shadow-xl space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Sliders className="w-5 h-5 text-indigo-400" />
          <span>Health Probe & Telemetry Timing</span>
        </h3>

        <div className="space-y-4 text-xs">
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <div>
              <div className="font-semibold text-slate-200">Auto-Ping Background Health Check</div>
              <div className="text-slate-400 text-[11px] mt-0.5">Continuously measure API latency and connection state</div>
            </div>
            <button
              type="button"
              onClick={() => setAutoPing(!autoPing)}
              className={`w-12 h-6 rounded-full transition-colors relative ${autoPing ? 'bg-cyan-500' : 'bg-slate-800'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-slate-950 absolute top-1 transition-transform ${autoPing ? 'left-7' : 'left-1'}`} />
            </button>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-slate-200">Probe Frequency</span>
              <span className="text-cyan-400 font-bold font-mono">{pingIntervalSeconds} seconds</span>
            </div>
            <input
              type="range"
              min="5"
              max="60"
              step="5"
              value={pingIntervalSeconds}
              onChange={(e) => setPingIntervalSeconds(Number(e.target.value))}
              className="w-full accent-cyan-400"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>5s (Aggressive)</span>
              <span>30s</span>
              <span>60s (Gentle)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Storage & Demo Data Management */}
      <div className="p-6 rounded-3xl bg-[#111726]/80 border border-slate-800/90 backdrop-blur-xl shadow-xl space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <HardDrive className="w-5 h-5 text-purple-400" />
          <span>Local Storage & Demo Seeders</span>
        </h3>
        <p className="text-xs text-slate-400">
          Manage local caching state used when the Django backend is offline or for sandbox evaluation.
        </p>

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            onClick={handleSeedData}
            className="px-4 py-2.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-300 text-xs font-bold transition-colors flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Seed 3 Sample Cluster Items</span>
          </button>

          <button
            onClick={handleResetCache}
            className="px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-bold transition-colors flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            <span>Reset Local Storage Cache</span>
          </button>
        </div>
      </div>

      {/* K8s Deploy Reference Card */}
      <div className="p-6 rounded-3xl bg-[#111726]/80 border border-slate-800/90 backdrop-blur-xl shadow-xl space-y-3">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Code className="w-5 h-5 text-emerald-400" />
          <span>Quick Deployment Commands</span>
        </h3>
        <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 text-xs font-mono text-cyan-300 space-y-1.5 overflow-x-auto">
          <div><span className="text-slate-500"># Apply k8s manifests on master node</span></div>
          <div>kubectl apply -f namespace.yaml</div>
          <div>kubectl apply -f backend-deployment.yaml -f backend-service.yaml</div>
          <div>kubectl apply -f frontend-deployment.yaml -f frontend-service.yaml</div>
          <div className="pt-1 text-slate-500"># Run Django migrations inside backend pod</div>
          <div>kubectl exec -n myapp -it deploy/backend -- python manage.py migrate</div>
        </div>
      </div>
    </div>
  );
}
