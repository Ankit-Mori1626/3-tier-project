import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { 
  Network, 
  Server, 
  Cpu, 
  HardDrive, 
  Layers, 
  RefreshCw, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight, 
  ExternalLink, 
  Zap, 
  Terminal, 
  AlertTriangle, 
  Boxes,
  Database,
  Lock,
  Globe,
  GitBranch,
  Shield,
  Radio
} from 'lucide-react';
import NodeDetailModal from './NodeDetailModal';

export default function ClusterTab() {
  const { clusterTopology, fetchClusterTopology, infrastructureSpec } = useApp();
  const [selectedNode, setSelectedNode] = useState(null);
  const [isNodeModalOpen, setIsNodeModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchClusterTopology(false);
    setIsRefreshing(false);
  };

  const handleOpenNode = (node) => {
    setSelectedNode(node);
    setIsNodeModalOpen(true);
  };

  const nodes = clusterTopology.nodes || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-white tracking-tight">
              3-Tier Cloud Architecture & Kubernetes Topology
            </h2>
            {clusterTopology.connected ? (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 beacon-online" />
                Live Cluster: {clusterTopology.total_nodes} Node(s), {clusterTopology.total_pods} Pod(s)
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                Disconnected / Standalone
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Production VPC with Public Bastion, Private Jenkins & K8s fleet, and Multi-AZ AWS Aurora RDS.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 text-xs font-semibold transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Sync Live Cluster</span>
          </button>
        </div>
      </div>

      {/* 5-INSTANCE AWS VPC ARCHITECTURE VISUALIZATION */}
      <div className="p-6 rounded-3xl bg-[#111726]/90 border border-indigo-500/30 shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-indigo-400" />
              <span>AWS VPC 3-Tier Infrastructure (5 Instances + Aurora RDS)</span>
            </h3>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              CIDR: 10.0.0.0/16 • ap-south-1 (Mumbai) • Multi-AZ Segregation
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Private Security Isolation: Active
            </span>
          </div>
        </div>

        {/* 3 Subnet Tiers */}
        <div className="space-y-4">
          {/* TIER 1: PUBLIC SUBNET */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-cyan-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
                  Tier 1: Public Subnet (10.0.1.0/24) — Internet Gateway & NAT
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/60 text-cyan-400 border border-cyan-500/20">
                Internet Facing
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              {/* Instance 1: Bastion Jump Host */}
              <div className="p-4 rounded-xl bg-[#0c1220] border border-slate-800 flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 beacon-online" />
                    <span className="font-mono font-bold text-slate-100 text-sm">Bastion Jump Server</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 font-mono">EC2 #1</span>
                  </div>
                  <p className="text-xs text-slate-400">Secure SSH entry point for private subnets</p>
                  <div className="text-[11px] font-mono text-slate-300 space-y-0.5 pt-1">
                    <div>Public IP: <span className="text-cyan-300">54.210.82.10</span></div>
                    <div>Private IP: <span className="text-slate-400">10.0.1.15</span> • Port: <span className="text-slate-200">22 (SSH)</span></div>
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                  <Lock className="w-4 h-4" />
                </div>
              </div>

              {/* NAT Gateway */}
              <div className="p-4 rounded-xl bg-[#0c1220] border border-slate-800 flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 beacon-online" />
                    <span className="font-mono font-bold text-slate-100 text-sm">AWS NAT Gateway + EIP</span>
                  </div>
                  <p className="text-xs text-slate-400">Routes outbound traffic for private worker nodes</p>
                  <div className="text-[11px] font-mono text-slate-300 space-y-0.5 pt-1">
                    <div>Target: <span className="text-emerald-400">0.0.0.0/0 via IGW</span></div>
                    <div>State: <span className="text-slate-400">Active High Availability</span></div>
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                  <Network className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>

          {/* TIER 2: PRIVATE APP SUBNETS (COMPUTE & K8S) */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-indigo-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
                  Tier 2: Private App Subnets (10.0.2.0/24 & 10.0.3.0/24) — K8s Cluster & CI/CD
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950/60 text-indigo-400 border border-indigo-500/20">
                No Direct Public Ingress
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
              {/* Instance 2: Jenkins */}
              <div className="p-3.5 rounded-xl bg-[#0c1220] border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-300 font-mono">Jenkins Server</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 font-mono">EC2 #2</span>
                </div>
                <p className="text-[11px] text-slate-400">CI/CD automation pipeline & docker build runner</p>
                <div className="text-[10px] font-mono text-slate-300 border-t border-slate-800 pt-1.5">
                  <div>IP: <span className="text-indigo-300">10.0.2.20</span></div>
                  <div>Ports: 8080 (UI), 50000</div>
                </div>
              </div>

              {/* Instance 3: Master Node */}
              <div className="p-3.5 rounded-xl bg-[#0c1220] border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-300 font-mono">K8s Master Node</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 font-mono">EC2 #3</span>
                </div>
                <p className="text-[11px] text-slate-400">Control Plane (apiserver, etcd, scheduler)</p>
                <div className="text-[10px] font-mono text-slate-300 border-t border-slate-800 pt-1.5">
                  <div>IP: <span className="text-indigo-300">10.0.2.10</span></div>
                  <div>Ports: 6443, 2379-2380</div>
                </div>
              </div>

              {/* Instance 4: Worker 1 Frontend */}
              <div className="p-3.5 rounded-xl bg-[#0c1220] border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-300 font-mono">Worker 1 (Frontend)</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 font-mono">EC2 #4</span>
                </div>
                <p className="text-[11px] text-slate-400">Hosts React Nginx Frontend pods</p>
                <div className="text-[10px] font-mono text-slate-300 border-t border-slate-800 pt-1.5">
                  <div>IP: <span className="text-cyan-300">10.0.2.25</span></div>
                  <div>NodePort: 30080</div>
                </div>
              </div>

              {/* Instance 5: Worker 2 Backend */}
              <div className="p-3.5 rounded-xl bg-[#0c1220] border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-300 font-mono">Worker 2 (Backend)</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 font-mono">EC2 #5</span>
                </div>
                <p className="text-[11px] text-slate-400">Hosts Django REST API & Gunicorn pods</p>
                <div className="text-[10px] font-mono text-slate-300 border-t border-slate-800 pt-1.5">
                  <div>IP: <span className="text-purple-300">10.0.3.30</span></div>
                  <div>NodePort: 30800</div>
                </div>
              </div>
            </div>
          </div>

          {/* TIER 3: PRIVATE DB SUBNETS (AWS AURORA RDS) */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-purple-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-bold text-purple-300 uppercase tracking-wider">
                  Tier 3: Private DB Subnets (10.0.10.0/24 & 10.0.11.0/24) — AWS Aurora PostgreSQL RDS
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950/60 text-purple-400 border border-purple-500/20">
                Multi-AZ Managed Cluster
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <div className="p-4 rounded-xl bg-[#0c1220] border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-slate-100 text-sm">Aurora RDS Primary (Writer)</span>
                  <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 beacon-online" /> Port 5432
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Direct database endpoint connected to Django Backend worker pods with auto-failover.
                </p>
                <div className="text-[11px] font-mono text-purple-300 truncate">
                  k8s-aurora-cluster.cluster-xyz.ap-south-1.rds.amazonaws.com
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#0c1220] border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-slate-100 text-sm">Security Isolation Policy</span>
                  <span className="text-xs text-purple-400 font-mono">Zero-Trust</span>
                </div>
                <p className="text-xs text-slate-400">
                  Inbound port 5432 is restricted strictly to Worker 2 (Backend security group) and Bastion.
                </p>
                <div className="text-[11px] font-mono text-emerald-400">
                  Protected with encrypted storage & IAM authentication.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* REAL KUBERNETES NODE FLEET */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Boxes className="w-5 h-5 text-cyan-400" />
            <span>Live Kubernetes Node Fleet ({nodes.length})</span>
          </h3>
          <span className="text-xs text-slate-400">Queried directly from Kubernetes API</span>
        </div>

        {nodes.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {nodes.map((node) => (
              <motion.div
                key={node.id}
                whileHover={{ y: -2 }}
                className="p-6 rounded-3xl bg-[#111726]/90 backdrop-blur-md border border-slate-800 hover:border-cyan-500/40 transition-all flex flex-col justify-between space-y-4 shadow-xl"
              >
                <div>
                  <div className="flex items-start justify-between pb-4 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-2xl ${node.role === 'control-plane' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'}`}>
                        <Server className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-100 font-mono text-base">{node.name}</h4>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${node.role === 'control-plane' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-cyan-500/20 text-cyan-300'}`}>
                            {node.role === 'control-plane' ? 'Control Plane' : 'Worker'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">
                          IP: {node.ip} • Kubelet: {node.kubeletVersion}
                        </p>
                      </div>
                    </div>

                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5 ${
                      node.status === 'Ready' 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${node.status === 'Ready' ? 'bg-emerald-400 beacon-online' : 'bg-rose-400'}`} />
                      {node.status}
                    </span>
                  </div>

                  {/* Resource Capacities */}
                  <div className="grid grid-cols-2 gap-3 mt-4 text-xs">
                    <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                      <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mb-1">
                        <Cpu className="w-3.5 h-3.5 text-cyan-400" /> CPU Capacity
                      </div>
                      <div className="text-base font-bold text-slate-100 font-mono">{node.cpuCapacity} Cores</div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                      <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mb-1">
                        <HardDrive className="w-3.5 h-3.5 text-indigo-400" /> Memory Capacity
                      </div>
                      <div className="text-base font-bold text-slate-100 font-mono">{node.memoryCapacity}</div>
                    </div>
                  </div>

                  {/* Real Pods list */}
                  <div className="mt-5 space-y-2">
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Boxes className="w-3.5 h-3.5 text-cyan-400" /> Assigned Pods ({node.pods?.length || 0})
                      </span>
                    </div>

                    <div className="max-h-52 overflow-y-auto space-y-2 pr-1">
                      {node.pods && node.pods.length > 0 ? (
                        node.pods.map((pod, pIdx) => (
                          <div
                            key={pIdx}
                            className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center justify-between text-xs"
                          >
                            <div className="min-w-0 pr-2">
                              <div className="font-mono font-medium text-slate-200 truncate">{pod.name}</div>
                              <div className="text-[10px] text-slate-400 font-mono mt-0.5 flex items-center gap-2">
                                <span className="text-cyan-400">ns: {pod.namespace}</span>
                                <span>IP: {pod.ip}</span>
                                {pod.restarts > 0 && <span className="text-amber-400 font-semibold">{pod.restarts} restart(s)</span>}
                              </div>
                            </div>

                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold shrink-0 ${
                              pod.status === 'Running' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                              pod.status === 'Pending' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse' :
                              'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}>
                              {pod.status}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 text-center text-xs text-slate-400">
                          No pods currently running on this node.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleOpenNode(node)}
                  className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-200 text-xs font-semibold transition-colors flex items-center justify-center gap-2 mt-4"
                >
                  <span>Inspect Node & Telemetry</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800 text-center space-y-2">
            <p className="text-sm text-slate-300">No active Kubernetes cluster nodes detected.</p>
            <p className="text-xs text-slate-500">Ensure Kubernetes is enabled or connected to view live nodes.</p>
          </div>
        )}
      </div>

      <NodeDetailModal
        node={selectedNode}
        isOpen={isNodeModalOpen}
        onClose={() => setIsNodeModalOpen(false)}
      />
    </div>
  );
}


