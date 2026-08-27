import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import DashboardTab from './components/DashboardTab';
import WorkloadsTab from './components/WorkloadsTab';
import ItemsTab from './components/ItemsTab';
import ClusterTab from './components/ClusterTab';
import ApiTesterTab from './components/ApiTesterTab';
import LogsTab from './components/LogsTab';
import SettingsTab from './components/SettingsTab';
import ToastContainer from './components/ToastContainer';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Layers,
  Database, 
  Network, 
  Terminal, 
  ScrollText, 
  Settings 
} from 'lucide-react';
import './App.css';

function MainContent() {
  const { activeTab, setActiveTab } = useApp();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardTab />;
      case 'workloads':
        return <WorkloadsTab />;
      case 'items':
        return <ItemsTab />;
      case 'cluster':
        return <ClusterTab />;
      case 'apitester':
        return <ApiTesterTab />;
      case 'logs':
        return <LogsTab />;
      case 'settings':
        return <SettingsTab />;
      default:
        return <DashboardTab />;
    }
  };

  const MOBILE_NAV = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'workloads', label: 'Workloads', icon: Layers },
    { id: 'cluster', label: 'VPC/K8s', icon: Network },
    { id: 'items', label: 'DB', icon: Database },
    { id: 'logs', label: 'Events', icon: ScrollText },
    { id: 'settings', label: 'Config', icon: Settings },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#0a0d14] text-slate-100 selection:bg-cyan-500 selection:text-black">
      {/* Top Header */}
      <Header />

      {/* Main Layout Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Collapsible Sidebar */}
        <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

        {/* Dynamic Active Tab Content Container */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-24 md:pb-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
            >
              {renderActiveTab()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0d121f]/95 backdrop-blur-xl border-t border-slate-800/90 px-2 py-2 flex items-center justify-around">
        {MOBILE_NAV.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
                isActive 
                  ? 'text-cyan-400 font-bold bg-cyan-500/10' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Floating Notifications */}
      <ToastContainer />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
