import React from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { 
  LayoutDashboard, 
  Database, 
  Network, 
  Terminal, 
  ScrollText, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  Layers,
  Sparkles
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Cluster Overview', icon: LayoutDashboard, badge: 'Live' },
  { id: 'workloads', label: 'Workloads & Svc', icon: Layers, badge: 'Real-time' },
  { id: 'cluster', label: 'VPC Architecture', icon: Network, badge: '5 EC2 + RDS' },
  { id: 'items', label: 'Database Entities', icon: Database, countKey: 'items' },
  { id: 'apitester', label: 'REST API Tester', icon: Terminal },
  { id: 'logs', label: 'Cluster Events & Logs', icon: ScrollText, countKey: 'logs' },
  { id: 'settings', label: 'Configuration', icon: Settings }
];

export default function Sidebar({ isCollapsed, setIsCollapsed }) {
  const { activeTab, setActiveTab, items, logs } = useApp();

  const getCount = (key) => {
    if (key === 'items') return items.length;
    if (key === 'logs') return logs.length;
    return null;
  };

  return (
    <aside 
      className={`hidden md:flex flex-col bg-[#0d121f]/90 backdrop-blur-xl border-r border-slate-800/80 transition-all duration-300 relative z-20 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Navigation List */}
      <div className="flex-1 py-6 px-3 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-3">
          {!isCollapsed ? (
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              Control Plane
            </span>
          ) : (
            <div className="h-4 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            </div>
          )}
        </div>

        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const count = item.countKey ? getCount(item.countKey) : null;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full relative flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium transition-all group ${
                isActive
                  ? 'text-cyan-300 font-semibold bg-cyan-500/10 border border-cyan-500/30 shadow-lg shadow-cyan-950/40'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 border border-transparent'
              }`}
            >
              {/* Active Indicator Glow Bar */}
              {isActive && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-cyan-400 rounded-r-full shadow-[0_0_12px_#06b6d4]"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}

              <Icon className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-110 ${
                isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-200'
              }`} />

              {!isCollapsed && (
                <div className="flex-1 flex items-center justify-between min-w-0 text-left">
                  <span className="truncate">{item.label}</span>
                  {item.badge && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      {item.badge}
                    </span>
                  )}
                  {count !== null && (
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                      {count}
                    </span>
                  )}
                </div>
              )}

              {/* Tooltip on collapsed */}
              {isCollapsed && (
                <div className="absolute left-full ml-3 px-2.5 py-1 bg-slate-900 border border-slate-700 text-white text-xs font-semibold rounded-lg shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                  {item.label} {count !== null ? `(${count})` : ''}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Cluster Quick Status Card at bottom */}
      {!isCollapsed && (
        <div className="p-4 m-3 rounded-2xl bg-gradient-to-br from-slate-900 via-[#111726] to-cyan-950/30 border border-slate-800 text-xs">
          <div className="flex items-center gap-2 text-cyan-400 font-semibold mb-1">
            <Sparkles className="w-4 h-4" />
            <span>3-Tier K8s Cluster</span>
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed mb-3">
            AWS t3.medium EC2 instances running master-init & worker-join bootstrap.
          </p>
          <div className="flex items-center justify-between text-[11px] text-slate-300 pt-2 border-t border-slate-800">
            <span>NodePort: 30080</span>
            <span className="text-emerald-400 font-bold">READY</span>
          </div>
        </div>
      )}

      {/* Collapse Toggle Button */}
      <div className="p-3 border-t border-slate-800/80 flex items-center justify-end">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors w-full flex items-center justify-center gap-2 text-xs"
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span>Collapse Sidebar</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
