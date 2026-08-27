import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { 
  Boxes, 
  Layers, 
  Network, 
  Cpu, 
  RefreshCw, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Tag, 
  ShieldCheck, 
  ChevronRight,
  ExternalLink,
  Zap,
  Activity
} from 'lucide-react';

export default function WorkloadsTab() {
  const { workloads, fetchWorkloads } = useApp();
  const [activeSubTab, setActiveSubTab] = useState('all'); // 'all' | 'deployments' | 'services' | 'pods'
  const [selectedNamespace, setSelectedNamespace] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchWorkloads(false);
    setIsRefreshing(false);
  };

  const namespaces = useMemo(() => {
    const list = workloads.namespaces || [];
    return ['ALL', ...list];
  }, [workloads.namespaces]);

  const filteredDeployments = useMemo(() => {
    return (workloads.deployments || []).filter(d => {
      const matchNs = selectedNamespace === 'ALL' || d.namespace === selectedNamespace;
      const matchQuery = d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         d.namespace.toLowerCase().includes(searchQuery.toLowerCase());
      return matchNs && matchQuery;
    });
  }, [workloads.deployments, selectedNamespace, searchQuery]);

  const filteredServices = useMemo(() => {
    return (workloads.services || []).filter(s => {
      const matchNs = selectedNamespace === 'ALL' || s.namespace === selectedNamespace;
      const matchQuery = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         s.namespace.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (s.type && s.type.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchNs && matchQuery;
    });
  }, [workloads.services, selectedNamespace, searchQuery]);

  const filteredPods = useMemo(() => {
    return (workloads.pods || []).filter(p => {
      const matchNs = selectedNamespace === 'ALL' || p.namespace === selectedNamespace;
      const matchQuery = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         p.namespace.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (p.nodeName && p.nodeName.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchNs && matchQuery;
    });
  }, [workloads.pods, selectedNamespace, searchQuery]);

  const runningPodsCount = useMemo(() => {
    return (workloads.pods || []).filter(p => p.status === 'Running').length;
  }, [workloads.pods]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-white tracking-tight">
              Kubernetes Workloads & Services
            </h2>
            {workloads.connected ? (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 beacon-online" />
                Live Workloads Active
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                Disconnected
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time inspection of active Deployments, Services (svc), Pods, and ReplicaSets across all namespaces.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 text-xs font-semibold transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Sync Workloads</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          whileHover={{ y: -2 }}
          className="p-4 rounded-2xl bg-[#111726]/80 border border-slate-800 backdrop-blur-md shadow-xl"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">Deployments</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-white font-mono">
            {workloads.summary?.total_deployments || filteredDeployments.length}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Controllers Managing Rollouts</p>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          className="p-4 rounded-2xl bg-[#111726]/80 border border-slate-800 backdrop-blur-md shadow-xl"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">Services (svc)</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Network className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-white font-mono">
            {workloads.summary?.total_services || filteredServices.length}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">NodePort & ClusterIP Endpoints</p>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          className="p-4 rounded-2xl bg-[#111726]/80 border border-slate-800 backdrop-blur-md shadow-xl"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">Total Pods</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-white font-mono">
            {workloads.summary?.total_pods || filteredPods.length}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            <span className="text-emerald-400 font-semibold">{runningPodsCount} Running</span> • {workloads.pods?.length - runningPodsCount} Other
          </p>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          className="p-4 rounded-2xl bg-[#111726]/80 border border-slate-800 backdrop-blur-md shadow-xl"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">Namespaces</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Tag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-white font-mono">
            {workloads.summary?.total_namespaces || namespaces.length - 1}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Isolated Cluster Tenants</p>
        </motion.div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-[#111726]/70 border border-slate-800 backdrop-blur-md flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Sub-tab switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900/90 border border-slate-800 text-xs overflow-x-auto">
          {[
            { id: 'all', label: 'All Resources' },
            { id: 'deployments', label: `Deployments (${filteredDeployments.length})` },
            { id: 'services', label: `Services (${filteredServices.length})` },
            { id: 'pods', label: `Pods (${filteredPods.length})` }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all ${
                activeSubTab === tab.id
                  ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Namespace Selector */}
        <div className="flex items-center gap-2">
          {/* Namespace Filter */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300">
            <Filter className="w-3.5 h-3.5 text-cyan-400" />
            <select
              value={selectedNamespace}
              onChange={(e) => setSelectedNamespace(e.target.value)}
              aria-label="Filter by Namespace"
              className="bg-transparent border-none outline-none text-slate-200 font-mono text-xs cursor-pointer"
            >
              {namespaces.map(ns => (
                <option key={ns} value={ns} className="bg-slate-900 text-slate-200">
                  {ns === 'ALL' ? 'All Namespaces' : `ns: ${ns}`}
                </option>
              ))}
            </select>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search resource..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-200 placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-500/50"
            />
          </div>
        </div>
      </div>

      {/* 1. DEPLOYMENTS SECTION */}
      {(activeSubTab === 'all' || activeSubTab === 'deployments') && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Kubernetes Deployments ({filteredDeployments.length})</span>
            </h3>
          </div>

          {filteredDeployments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredDeployments.map((dep, idx) => (
                <motion.div
                  key={idx}
                  whileHover={{ y: -2 }}
                  className="p-5 rounded-2xl bg-[#111726]/80 border border-slate-800 hover:border-cyan-500/40 transition-all shadow-xl space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-100 text-base">{dep.name}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                          ns: {dep.namespace}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 font-mono">
                        Strategy: <span className="text-slate-300">{dep.strategy}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs">
                      <span className="text-slate-400">Replicas:</span>
                      <span className="font-bold text-emerald-400">{dep.readyReplicas}</span>
                      <span className="text-slate-500">/</span>
                      <span className="font-bold text-white">{dep.replicas}</span>
                    </div>
                  </div>

                  {/* Container Images */}
                  <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800/80 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Container Image(s):</span>
                    {dep.images?.map((img, iIdx) => (
                      <div key={iIdx} className="text-xs text-cyan-300 font-mono truncate">
                        {img}
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 text-center text-xs text-slate-400">
              No deployments found matching current criteria.
            </div>
          )}
        </div>
      )}

      {/* 2. SERVICES SECTION */}
      {(activeSubTab === 'all' || activeSubTab === 'services') && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Network className="w-4 h-4 text-indigo-400" />
              <span>Kubernetes Services & Endpoints ({filteredServices.length})</span>
            </h3>
          </div>

          {filteredServices.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredServices.map((svc, idx) => (
                <motion.div
                  key={idx}
                  whileHover={{ y: -2 }}
                  className="p-5 rounded-2xl bg-[#111726]/80 border border-slate-800 hover:border-indigo-500/40 transition-all shadow-xl space-y-3 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-mono font-bold text-slate-100 text-sm">{svc.name}</div>
                        <span className="text-[11px] text-slate-400 font-mono mt-0.5 block">
                          ns: {svc.namespace}
                        </span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        svc.type === 'NodePort' 
                          ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                          : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30'
                      }`}>
                        {svc.type}
                      </span>
                    </div>

                    <div className="mt-3 p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs space-y-1.5">
                      <div className="flex justify-between text-slate-400">
                        <span>ClusterIP:</span>
                        <span className="font-mono text-slate-200">{svc.clusterIP}</span>
                      </div>

                      {svc.ports?.map((p, pIdx) => (
                        <div key={pIdx} className="flex justify-between text-slate-400 pt-1 border-t border-slate-800/60">
                          <span>Port {p.port} → {p.targetPort}:</span>
                          {p.nodePort ? (
                            <span className="font-mono text-cyan-300 font-bold">NodePort {p.nodePort}</span>
                          ) : (
                            <span className="font-mono text-indigo-300">{p.protocol}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {svc.selector && Object.keys(svc.selector).length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
                      <span className="text-slate-500">Selector:</span>
                      {Object.entries(svc.selector).map(([k, v]) => (
                        <span key={k} className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 font-mono">
                          {k}={v}
                        </span>
                      ))}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 text-center text-xs text-slate-400">
              No services found matching current criteria.
            </div>
          )}
        </div>
      )}

      {/* 3. PODS FLEET SECTION */}
      {(activeSubTab === 'all' || activeSubTab === 'pods') && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Boxes className="w-4 h-4 text-purple-400" />
              <span>Pods Fleet ({filteredPods.length})</span>
            </h3>
          </div>

          {filteredPods.length > 0 ? (
            <div className="rounded-2xl bg-[#111726]/80 border border-slate-800 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/90 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Pod Name</th>
                      <th className="py-3 px-4">Namespace</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Node Placement</th>
                      <th className="py-3 px-4">IP Address</th>
                      <th className="py-3 px-4">Restarts</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                    {filteredPods.map((pod, idx) => (
                      <tr key={idx} className="hover:bg-slate-900/50 transition-colors">
                        <td className="py-3 px-4 font-medium text-slate-100 flex items-center gap-2 truncate max-w-xs">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${
                            pod.status === 'Running' ? 'bg-emerald-400 beacon-online' :
                            pod.status === 'Pending' ? 'bg-amber-400 animate-pulse' :
                            'bg-rose-400'
                          }`} />
                          <span className="truncate">{pod.name}</span>
                        </td>
                        <td className="py-3 px-4 text-cyan-300">{pod.namespace}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            pod.status === 'Running' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                            pod.status === 'Pending' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                            'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}>
                            {pod.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-400">{pod.nodeName}</td>
                        <td className="py-3 px-4 text-slate-400">{pod.ip}</td>
                        <td className="py-3 px-4">
                          <span className={pod.restarts > 0 ? 'text-amber-400 font-bold' : 'text-slate-500'}>
                            {pod.restarts}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 text-center text-xs text-slate-400">
              No pods found matching current criteria.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
