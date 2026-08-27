import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { 
  Activity, 
  Server, 
  Database, 
  Layers, 
  Plus, 
  RefreshCw, 
  Cpu, 
  CheckCircle2, 
  ArrowUpRight, 
  Zap, 
  Network,
  Shield,
  Clock
} from 'lucide-react';
import ItemModal from './ItemModal';
import NodeDetailModal from './NodeDetailModal';

export default function DashboardTab() {
  const { 
    items, 
    healthStatus, 
    probeHealth, 
    clusterTopology,
    clusterNodes, 
    setActiveTab, 
    addItem, 
    triggerConfetti,
    isFallbackMode 
  } = useApp();

  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const [isNodeModalOpen, setIsNodeModalOpen] = useState(false);

  const handleOpenNode = (node) => {
    setSelectedNode(node);
    setIsNodeModalOpen(true);
  };

  const totalNodes = clusterTopology?.total_nodes || clusterNodes.length;
  const totalPods = clusterTopology?.total_pods || 0;

  return (
    <div className="space-y-6">
      {/* Fallback Banner if offline */}
      {isFallbackMode && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-sm shadow-lg shadow-amber-950/20"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-amber-200">Offline Simulation & Local Cache Mode</h4>
              <p className="text-xs text-amber-300/80 mt-0.5">
                Django backend at port 8000 is not reachable. Changes are safely preserved locally and will auto-sync once connected!
              </p>
            </div>
          </div>
          <button
            onClick={() => probeHealth(false)}
            className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors shrink-0 flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry Connection
          </button>
        </motion.div>
      )}

      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#111726] via-[#161f33] to-[#0c1424] border border-cyan-500/20 p-6 lg:p-8 shadow-2xl">
        <div className="absolute -right-10 -top-10 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-40 -bottom-10 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold">
              <Shield className="w-3.5 h-3.5 text-cyan-400" />
              <span>Kubernetes Real-Time Cluster Stack</span>
            </div>
            <h2 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
              3-Tier Cloud Infrastructure Dashboard
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              Real-time monitoring of your live Kubernetes cluster nodes and pods, Django REST API, and PostgreSQL data persistence.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsItemModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-bold text-sm shadow-lg shadow-cyan-500/25 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>New Resource Item</span>
            </button>
            <button
              onClick={() => {
                triggerConfetti();
                probeHealth(false);
              }}
              className="px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-200 text-sm font-medium transition-colors flex items-center gap-2"
            >
              <Zap className="w-4 h-4 text-cyan-400" />
              <span>Test Live Pulse</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <motion.div
          whileHover={{ y: -3 }}
          className="p-5 rounded-2xl bg-[#111726]/80 backdrop-blur-md border border-slate-800/90 shadow-xl relative overflow-hidden group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">API & DB Health</span>
            <div className={`p-2.5 rounded-xl ${healthStatus.state === 'connected' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'}`}>
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white tracking-tight">
              {healthStatus.state === 'connected' ? `${healthStatus.latency}ms` : 'Offline'}
            </span>
            <span className={`text-xs font-semibold ${healthStatus.state === 'connected' ? 'text-emerald-400' : 'text-amber-400'}`}>
              {healthStatus.state === 'connected' ? '✓ RDS Connected' : '• Local Mode'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
            <Clock className="w-3 h-3" /> Auto-probe every 10s
          </p>
        </motion.div>

        {/* Metric 2 */}
        <motion.div
          whileHover={{ y: -3 }}
          className="p-5 rounded-2xl bg-[#111726]/80 backdrop-blur-md border border-slate-800/90 shadow-xl relative overflow-hidden group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Database Entities</span>
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <Database className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white tracking-tight">{items.length}</span>
            <span className="text-xs font-semibold text-cyan-400">Aurora RDS</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Postgres Table persistence</p>
        </motion.div>

        {/* Metric 3 */}
        <motion.div
          whileHover={{ y: -3 }}
          className="p-5 rounded-2xl bg-[#111726]/80 backdrop-blur-md border border-slate-800/90 shadow-xl relative overflow-hidden group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">K8s Cluster Nodes</span>
            <div className={`p-2.5 rounded-xl ${clusterTopology.connected ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30' : 'bg-slate-800 text-slate-400'}`}>
              <Server className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white tracking-tight">
              {clusterTopology.connected ? totalNodes : '0'}
            </span>
            <span className={`text-xs font-semibold ${clusterTopology.connected ? 'text-emerald-400' : 'text-slate-400'}`}>
              {clusterTopology.connected ? 'Live Online' : 'Not Connected'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {clusterTopology.connected ? 'Queried from K8s API' : 'Standalone Dev Mode'}
          </p>
        </motion.div>

        {/* Metric 4 */}
        <motion.div
          whileHover={{ y: -3 }}
          className="p-5 rounded-2xl bg-[#111726]/80 backdrop-blur-md border border-slate-800/90 shadow-xl relative overflow-hidden group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cluster Pods Fleet</span>
            <div className={`p-2.5 rounded-xl ${clusterTopology.connected ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30' : 'bg-slate-800 text-slate-400'}`}>
              <Cpu className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white tracking-tight">
              {clusterTopology.connected ? totalPods : '0'}
            </span>
            <span className={`text-xs font-semibold ${clusterTopology.connected ? 'text-purple-400' : 'text-slate-400'}`}>
              {clusterTopology.connected ? 'Real Pods Active' : '0 Pods'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {clusterTopology.connected ? 'Mapped to Nodes' : 'Waiting for cluster'}
          </p>
        </motion.div>
      </div>

      {/* Cluster Nodes Visual Map */}
      <div className="p-6 rounded-3xl bg-[#111726]/70 border border-slate-800/80 backdrop-blur-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Network className="w-5 h-5 text-cyan-400" />
              <span>Kubernetes Cluster Topology</span>
            </h3>
            <p className="text-xs text-slate-400">
              {clusterTopology.connected ? 'Click any node to inspect real telemetry and pods.' : 'Connect a live Kubernetes cluster to view topology.'}
            </p>
          </div>
          <button
            onClick={() => setActiveTab('cluster')}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 hover:underline"
          >
            <span>Full Topology View</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {clusterNodes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 pt-2">
            {clusterNodes.map((node) => (
              <motion.div
                key={node.id}
                whileHover={{ y: -4 }}
                onClick={() => handleOpenNode(node)}
                className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 cursor-pointer transition-all hover:shadow-xl hover:shadow-cyan-950/30 group"
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${node.role === 'control-plane' ? 'bg-indigo-400' : 'bg-cyan-400'} beacon-online`} />
                    <span className="font-bold text-slate-100 text-sm group-hover:text-cyan-300 transition-colors font-mono">
                      {node.name}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {node.status}
                  </span>
                </div>

                <div className="mt-3 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Role:</span>
                    <span className="text-slate-200 font-medium">{node.role}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>IP Address:</span>
                    <span className="text-cyan-300 font-mono text-[11px]">{node.ip}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Capacity:</span>
                    <span className="text-slate-200 font-mono text-[11px]">{node.cpuCapacity} CPU / {node.memoryCapacity}</span>
                  </div>

                  <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80">
                    <span>Pods Running</span>
                    <span className="font-bold text-white px-2 py-0.5 rounded bg-slate-800">
                      {node.pods?.length || 0}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800 text-center space-y-2">
            <p className="text-sm text-slate-300">No active Kubernetes cluster nodes detected.</p>
            <p className="text-xs text-slate-500">Go to the Cluster tab or enable Kubernetes in Docker Desktop / start Minikube to view live nodes.</p>
          </div>
        )}
      </div>


      {/* Recent Items Preview Section */}
      <div className="p-6 rounded-3xl bg-[#111726]/70 border border-slate-800/80 backdrop-blur-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-indigo-400" />
              <span>Recent Resource Items</span>
            </h3>
            <p className="text-xs text-slate-400">Entities stored in Postgres database via Django REST API</p>
          </div>
          <button
            onClick={() => setActiveTab('items')}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 hover:underline"
          >
            <span>Manage All Items ({items.length})</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.slice(0, 6).map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-indigo-500/30 transition-all flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    {item.category || 'General'}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    ID #{item.id}
                  </span>
                </div>
                <h4 className="font-bold text-slate-100 text-sm line-clamp-1">{item.name}</h4>
                <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                  {item.description || 'No description provided.'}
                </p>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-800/80">
                <span className="capitalize">{item.priority || 'Medium'} Priority</span>
                <span className="text-emerald-400 font-medium">✓ Active</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modals */}
      <ItemModal
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        onSubmit={addItem}
      />

      <NodeDetailModal
        node={selectedNode}
        isOpen={isNodeModalOpen}
        onClose={() => setIsNodeModalOpen(false)}
      />
    </div>
  );
}
