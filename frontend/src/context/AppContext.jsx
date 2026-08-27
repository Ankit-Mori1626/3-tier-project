import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { apiService } from '../services/api';
import confetti from 'canvas-confetti';

const AppContext = createContext();

export function AppProvider({ children }) {
  // Navigation
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // API URL & Connection
  const [apiUrl, setApiUrlState] = useState(apiService.getBaseUrl());
  const [healthStatus, setHealthStatus] = useState({
    state: 'checking', // 'checking' | 'connected' | 'unreachable' | 'error'
    latency: 0,
    service: 'django-backend',
    lastChecked: null,
    error: null
  });
  const [autoPing, setAutoPing] = useState(true);
  const [pingIntervalSeconds, setPingIntervalSeconds] = useState(10);

  // Items State
  const [items, setItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [isFallbackMode, setIsFallbackMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Logs State
  const [logs, setLogs] = useState([
    {
      id: 1,
      timestamp: new Date().toLocaleTimeString(),
      level: 'INFO',
      source: 'K8s Control Plane',
      message: 'Cluster initialization complete. 1 Master and 3 Worker nodes registered.'
    },
    {
      id: 2,
      timestamp: new Date().toLocaleTimeString(),
      level: 'SUCCESS',
      source: 'Flannel CNI',
      message: 'Pod network CIDR 10.244.0.0/16 established across worker nodes.'
    }
  ]);

  // Toasts
  const [toasts, setToasts] = useState([]);

  // Real K8s Cluster Topology State
  const [clusterTopology, setClusterTopology] = useState({
    connected: false,
    loading: true,
    error: null,
    total_nodes: 0,
    total_pods: 0,
    nodes: []
  });

  // Real K8s Workloads (Deployments, Services, Pods, Namespaces)
  const [workloads, setWorkloads] = useState({
    connected: false,
    loading: true,
    error: null,
    deployments: [],
    services: [],
    pods: [],
    namespaces: [],
    summary: { total_deployments: 0, total_services: 0, total_pods: 0, total_namespaces: 0 }
  });

  // Real K8s Cluster Events
  const [clusterEvents, setClusterEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

  // 5-Instance Infrastructure Spec
  const [infrastructureSpec, setInfrastructureSpec] = useState(null);

  // Helper: Toast Dispatcher
  const addToast = useCallback((title, message, type = 'info') => {
    const id = Date.now() + Math.random().toString(36).substr(2, 4);
    setToasts(prev => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Helper: Log Dispatcher
  const addLog = useCallback((message, level = 'INFO', source = 'Frontend') => {
    setLogs(prev => [
      {
        id: Date.now() + Math.random(),
        timestamp: new Date().toLocaleTimeString(),
        level,
        source,
        message
      },
      ...prev.slice(0, 199) // Keep last 200 logs
    ]);
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
    addToast('Logs Cleared', 'Live activity buffer has been reset.', 'info');
  }, [addToast]);

  // Helper: Confetti
  const triggerConfetti = useCallback(() => {
    try {
      confetti({
        particleCount: 75,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#06b6d4', '#6366f1', '#10b981', '#a855f7']
      });
    } catch {
      // ignore
    }
  }, []);

  // Change API URL
  const setApiUrl = useCallback((newUrl) => {
    apiService.setBaseUrl(newUrl);
    setApiUrlState(newUrl);
    addLog(`Target Backend API URL updated to: ${newUrl}`, 'INFO', 'Config');
    addToast('API URL Updated', `Now targeting ${newUrl}`, 'info');
  }, [addLog, addToast]);

  // Health Probe
  const probeHealth = useCallback(async (silent = false) => {
    const result = await apiService.checkHealth();
    if (result.connected) {
      setHealthStatus({
        state: 'connected',
        latency: result.latency,
        service: result.data?.service || 'django-backend',
        database: result.data?.database || {},
        lastChecked: new Date(),
        error: null
      });
      if (!silent) {
        addLog(`Backend health probe OK (${result.latency}ms) - Django & DB connected`, 'SUCCESS', 'HealthCheck');
      }
    } else {
      setHealthStatus({
        state: result.status === 'unreachable' ? 'unreachable' : 'error',
        latency: result.latency,
        service: 'offline',
        database: {},
        lastChecked: new Date(),
        error: result.error || `HTTP ${result.statusCode}`
      });
      if (!silent) {
        addLog(`Backend probe failed: ${result.error || result.statusCode || 'Unreachable'}`, 'WARN', 'HealthCheck');
      }
    }
    return result;
  }, [addLog]);

  // Fetch Items
  const fetchItems = useCallback(async (notify = false) => {
    setLoadingItems(true);
    try {
      const res = await apiService.getItems();
      setItems(res.data);
      setIsFallbackMode(res.isFallback);
      if (notify) {
        addToast(
          res.isFallback ? 'Loaded Local Cache' : 'Synchronized with Database',
          `Loaded ${res.data.length} item(s).`,
          res.isFallback ? 'warning' : 'success'
        );
      }
      addLog(
        `Fetched ${res.data.length} item(s) (${res.isFallback ? 'Local Storage Fallback' : 'Live Aurora RDS PostgreSQL'})`,
        res.isFallback ? 'WARN' : 'SUCCESS',
        'DataStore'
      );
    } catch (err) {
      addLog(`Failed to fetch items: ${err.message}`, 'ERROR', 'DataStore');
    } finally {
      setLoadingItems(false);
    }
  }, [addLog, addToast]);

  // Add Item
  const addItem = async (itemData) => {
    try {
      const res = await apiService.createItem(itemData);
      setItems(prev => [res.item, ...prev]);
      setIsFallbackMode(res.isFallback);
      triggerConfetti();
      addToast('Item Created', `"${itemData.name}" was added successfully.`, 'success');
      addLog(`Created new item: "${itemData.name}"`, 'SUCCESS', 'DataStore');
      return res.item;
    } catch (err) {
      addToast('Creation Error', err.message, 'error');
      addLog(`Error creating item: ${err.message}`, 'ERROR', 'DataStore');
      throw err;
    }
  };

  // Edit Item
  const editItem = async (id, itemData) => {
    try {
      const res = await apiService.updateItem(id, itemData);
      setItems(prev => prev.map(item => item.id === id ? res.item : item));
      addToast('Item Updated', `"${itemData.name}" was updated.`, 'success');
      addLog(`Updated item #${id}: "${itemData.name}"`, 'INFO', 'DataStore');
      return res.item;
    } catch (err) {
      addToast('Update Error', err.message, 'error');
      addLog(`Error updating item #${id}: ${err.message}`, 'ERROR', 'DataStore');
      throw err;
    }
  };

  // Remove Item
  const removeItem = async (id, name = 'Item') => {
    try {
      await apiService.deleteItem(id);
      setItems(prev => prev.filter(item => item.id !== id));
      addToast('Item Deleted', `"${name}" has been removed.`, 'info');
      addLog(`Deleted item #${id} ("${name}")`, 'WARN', 'DataStore');
    } catch (err) {
      addToast('Delete Error', err.message, 'error');
      addLog(`Error deleting item #${id}: ${err.message}`, 'ERROR', 'DataStore');
    }
  };

  // Fetch Real Cluster Topology
  const fetchClusterTopology = useCallback(async (silent = false) => {
    try {
      const data = await apiService.getClusterTopology();
      setClusterTopology({
        connected: Boolean(data.connected),
        loading: false,
        error: data.error || null,
        total_nodes: data.total_nodes || 0,
        total_pods: data.total_pods || 0,
        nodes: data.nodes || []
      });
      if (!silent && data.connected) {
        addLog(`Cluster Topology synced: ${data.total_nodes} Node(s), ${data.total_pods} Pod(s) live`, 'SUCCESS', 'K8s');
      }
    } catch (err) {
      setClusterTopology({
        connected: false,
        loading: false,
        error: err.message,
        total_nodes: 0,
        total_pods: 0,
        nodes: []
      });
    }
  }, [addLog]);

  // Fetch Real Workloads
  const fetchWorkloads = useCallback(async (silent = false) => {
    try {
      const data = await apiService.getClusterWorkloads();
      setWorkloads({
        connected: Boolean(data.connected),
        loading: false,
        error: data.error || null,
        deployments: data.deployments || [],
        services: data.services || [],
        pods: data.pods || [],
        namespaces: data.namespaces || [],
        summary: data.summary || { total_deployments: 0, total_services: 0, total_pods: 0, total_namespaces: 0 }
      });
      if (!silent && data.connected) {
        addLog(`Workloads synced: ${data.deployments?.length || 0} Deployments, ${data.services?.length || 0} Services, ${data.pods?.length || 0} Pods`, 'SUCCESS', 'K8s');
      }
    } catch (err) {
      setWorkloads({
        connected: false,
        loading: false,
        error: err.message,
        deployments: [],
        services: [],
        pods: [],
        namespaces: [],
        summary: { total_deployments: 0, total_services: 0, total_pods: 0, total_namespaces: 0 }
      });
    }
  }, [addLog]);

  // Fetch Cluster Events
  const fetchEvents = useCallback(async () => {
    setLoadingEvents(true);
    try {
      const data = await apiService.getClusterEvents();
      if (data.connected && data.events) {
        setClusterEvents(data.events);
      }
    } catch {
      // ignore
    } finally {
      setLoadingEvents(false);
    }
  }, []);

  // Fetch Infrastructure Spec
  const fetchInfrastructure = useCallback(async () => {
    const data = await apiService.getInfrastructureSpec();
    if (data) {
      setInfrastructureSpec(data);
    }
  }, []);

  // Initial Load & Auto-Ping Interval
  useEffect(() => {
    probeHealth(true);
    fetchItems(false);
    fetchClusterTopology(true);
    fetchWorkloads(true);
    fetchEvents();
    fetchInfrastructure();
  }, [probeHealth, fetchItems, fetchClusterTopology, fetchWorkloads, fetchEvents, fetchInfrastructure]);

  const pingTimerRef = useRef(null);
  useEffect(() => {
    if (!autoPing) return;
    pingTimerRef.current = setInterval(() => {
      probeHealth(true);
      fetchClusterTopology(true);
      fetchWorkloads(true);
    }, pingIntervalSeconds * 1000);

    return () => clearInterval(pingTimerRef.current);
  }, [autoPing, pingIntervalSeconds, probeHealth, fetchClusterTopology, fetchWorkloads]);

  const value = {
    activeTab,
    setActiveTab,
    apiUrl,
    setApiUrl,
    healthStatus,
    probeHealth,
    autoPing,
    setAutoPing,
    pingIntervalSeconds,
    setPingIntervalSeconds,
    items,
    loadingItems,
    isFallbackMode,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    fetchItems,
    addItem,
    editItem,
    removeItem,
    logs,
    addLog,
    clearLogs,
    toasts,
    addToast,
    removeToast,
    triggerConfetti,
    clusterTopology,
    clusterNodes: clusterTopology.nodes,
    fetchClusterTopology,
    workloads,
    fetchWorkloads,
    clusterEvents,
    loadingEvents,
    fetchEvents,
    infrastructureSpec
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );


}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
