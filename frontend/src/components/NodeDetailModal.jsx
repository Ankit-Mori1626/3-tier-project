import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Server, Cpu, HardDrive, Shield, Terminal, Boxes } from 'lucide-react';

export default function NodeDetailModal({ node, isOpen, onClose }) {
  if (!node) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.93, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="relative w-full max-w-2xl bg-[#111726] border border-cyan-500/30 rounded-2xl p-6 shadow-2xl shadow-cyan-950/40 max-h-[90vh] overflow-y-auto"
          >
            {/* Accent Header Line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600" />

            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 border border-cyan-500/30 text-cyan-300">
                  <Server className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-slate-100 font-mono">{node.name}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                      node.status === 'Ready'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                    }`}>
                      {node.status}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                      {node.role === 'control-plane' ? 'Control Plane' : 'Worker'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 font-mono">
                    IP: {node.ip} • Kubelet: {node.kubeletVersion}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Resource Capacities */}
            <div className="grid grid-cols-2 gap-4 mt-5">
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Cpu className="w-4 h-4 text-cyan-400" /> CPU Capacity
                  </span>
                </div>
                <div className="text-xl font-bold text-cyan-400 font-mono">{node.cpuCapacity} Cores</div>
                <p className="text-[11px] text-slate-400 mt-1">Available to kubelet scheduler</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <HardDrive className="w-4 h-4 text-indigo-400" /> Memory Capacity
                  </span>
                </div>
                <div className="text-xl font-bold text-indigo-400 font-mono">{node.memoryCapacity}</div>
                <p className="text-[11px] text-slate-400 mt-1">Total allocatable RAM</p>
              </div>
            </div>

            {/* Node System Info */}
            <div className="mt-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs space-y-1.5">
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-400">OS Image & Arch:</span>
                <span className="font-mono text-slate-200">{node.os || 'Linux'}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-400">Kubelet Version:</span>
                <span className="font-mono text-cyan-300">{node.kubeletVersion || 'N/A'}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-400">Internal IP:</span>
                <span className="font-mono text-slate-200">{node.ip || 'N/A'}</span>
              </div>
            </div>

            {/* Deployed Pods Table */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <Boxes className="w-4 h-4 text-cyan-400" /> Real Pods on this Node ({node.pods?.length || 0})
                </h4>
                <span className="text-xs text-slate-400">Queried from K8s API</span>
              </div>

              <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                {node.pods && node.pods.length > 0 ? (
                  node.pods.map((pod, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between hover:border-slate-700 transition-all text-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                          pod.status === 'Running' ? 'bg-emerald-400 beacon-online' :
                          pod.status === 'Pending' ? 'bg-amber-400 animate-pulse' :
                          'bg-rose-400 animate-pulse'
                        }`} />
                        <div className="min-w-0">
                          <div className="font-medium text-slate-100 font-mono truncate">{pod.name}</div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-3 mt-0.5 font-mono">
                            <span className="text-cyan-400">Namespace: {pod.namespace}</span>
                            <span>IP: {pod.ip}</span>
                            {pod.restarts > 0 && <span className="text-amber-400">{pod.restarts} restart(s)</span>}
                          </div>
                        </div>
                      </div>

                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold shrink-0 ${
                        pod.status === 'Running' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        pod.status === 'Pending' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {pod.status}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 text-center text-xs text-slate-400">
                    No active pods running on this node.
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={onClose}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium transition-colors"
              >
                Close Inspector
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

