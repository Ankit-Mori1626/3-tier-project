/**
 * API Service Layer with Active Latency Measurement & Resilient Local Storage Fallback
 */

const DEFAULT_API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const STORAGE_KEY = 'k8s_app_items_cache';

// Initial starter mock data if first load and offline
const INITIAL_MOCK_ITEMS = [
  {
    id: 1,
    name: "Production Ingress Gateway",
    description: "Configured TLS termination, routing rules for /api and frontend static assets on port 80/443.",
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    status: "active",
    category: "Networking",
    priority: "High"
  },
  {
    id: 2,
    name: "PostgreSQL StatefulSet & PV",
    description: "Persistent Volume Claim mounted on /var/lib/postgresql/data with automated backup cron job.",
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    status: "active",
    category: "Database",
    priority: "Critical"
  },
  {
    id: 3,
    name: "Django REST API Autoscaler (HPA)",
    description: "Horizontal Pod Autoscaler set to scale 3-10 replicas based on 70% average CPU utilization.",
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    status: "pending",
    category: "Compute",
    priority: "Medium"
  },
  {
    id: 4,
    name: "Flannel CNI Subnet Overlay",
    description: "Cluster pod network CIDR 10.244.0.0/16 communicating across master and 3 worker nodes.",
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    status: "active",
    category: "Infrastructure",
    priority: "High"
  }
];

function getStoredItems() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_MOCK_ITEMS));
      return INITIAL_MOCK_ITEMS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_MOCK_ITEMS;
  }
}

function saveStoredItems(items) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (err) {
    console.error('Failed to save to local storage', err);
  }
}

export const apiService = {
  baseUrl: DEFAULT_API_URL,

  setBaseUrl(url) {
    this.baseUrl = url.replace(/\/+$/, '');
  },

  getBaseUrl() {
    return this.baseUrl;
  },

  /**
   * Probes backend health and returns latency in milliseconds
   */
  async checkHealth(signal) {
    const startTime = performance.now();
    try {
      const response = await fetch(`${this.baseUrl}/api/health/`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: signal || (AbortSignal.timeout ? AbortSignal.timeout(4000) : undefined)
      });
      const latency = Math.round(performance.now() - startTime);

      if (response.ok) {
        const data = await response.json();
        return {
          connected: true,
          status: 'ok',
          latency,
          data,
          timestamp: new Date()
        };
      }
      return {
        connected: false,
        status: 'error',
        statusCode: response.status,
        latency,
        timestamp: new Date()
      };
    } catch (error) {
      const latency = Math.round(performance.now() - startTime);
      return {
        connected: false,
        status: 'unreachable',
        error: error.message,
        latency,
        timestamp: new Date()
      };
    }
  },

  /**
   * Fetch items from backend with fallback
   */
  async getItems() {
    try {
      const response = await fetch(`${this.baseUrl}/api/items/`, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout ? AbortSignal.timeout(5000) : undefined
      });
      if (response.ok) {
        const data = await response.json();
        // sync to local storage cache
        if (Array.isArray(data)) {
          saveStoredItems(data);
          return { data, isFallback: false };
        }
      }
    } catch (err) {
      console.warn('Backend items endpoint unreachable, using local fallback:', err.message);
    }
    return { data: getStoredItems(), isFallback: true };
  },

  /**
   * Create item on backend or local cache
   */
  async createItem(itemData) {
    try {
      const response = await fetch(`${this.baseUrl}/api/items/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          name: itemData.name,
          description: itemData.description || ''
        }),
        signal: AbortSignal.timeout ? AbortSignal.timeout(5000) : undefined
      });

      if (response.ok) {
        const newItem = await response.json();
        // update local cache
        const local = getStoredItems();
        saveStoredItems([newItem, ...local]);
        return { item: newItem, isFallback: false };
      }
    } catch (err) {
      console.warn('Backend create failed, saving to local state:', err.message);
    }

    // Local fallback
    const local = getStoredItems();
    const fallbackItem = {
      id: Date.now(),
      name: itemData.name,
      description: itemData.description || '',
      created_at: new Date().toISOString(),
      status: itemData.status || 'active',
      category: itemData.category || 'General',
      priority: itemData.priority || 'Medium'
    };
    saveStoredItems([fallbackItem, ...local]);
    return { item: fallbackItem, isFallback: true };
  },

  /**
   * Update item on backend or local cache
   */
  async updateItem(id, itemData) {
    try {
      const response = await fetch(`${this.baseUrl}/api/items/${id}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          name: itemData.name,
          description: itemData.description || ''
        }),
        signal: AbortSignal.timeout ? AbortSignal.timeout(5000) : undefined
      });

      if (response.ok) {
        const updated = await response.json();
        const local = getStoredItems().map(i => i.id === id ? { ...i, ...updated } : i);
        saveStoredItems(local);
        return { item: updated, isFallback: false };
      }
    } catch (err) {
      console.warn('Backend update failed, updating local state:', err.message);
    }

    // Local fallback
    const local = getStoredItems().map(i => i.id === id ? { ...i, ...itemData } : i);
    saveStoredItems(local);
    const updated = local.find(i => i.id === id) || itemData;
    return { item: updated, isFallback: true };
  },

  /**
   * Delete item
   */
  async deleteItem(id) {
    let backendSuccess = false;
    try {
      const response = await fetch(`${this.baseUrl}/api/items/${id}/`, {
        method: 'DELETE',
        signal: AbortSignal.timeout ? AbortSignal.timeout(5000) : undefined
      });
      if (response.ok || response.status === 204) {
        backendSuccess = true;
      }
    } catch (err) {
      console.warn('Backend delete failed, removing locally:', err.message);
    }

    const local = getStoredItems().filter(i => i.id !== id);
    saveStoredItems(local);
    return { success: true, isFallback: !backendSuccess };
  },

  /**
   * Fetch real live Kubernetes Cluster Topology (Nodes, Pods, Namespaces, Status)
   */
  async getClusterTopology() {
    try {
      const response = await fetch(`${this.baseUrl}/api/cluster/topology/`, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout ? AbortSignal.timeout(6000) : undefined
      });
      if (response.ok) {
        const data = await response.json();
        return data;
      }
      return {
        connected: false,
        error: `Server responded with status ${response.status}`,
        nodes: [],
        total_nodes: 0,
        total_pods: 0
      };
    } catch (err) {
      return {
        connected: false,
        error: err.message,
        nodes: [],
        total_nodes: 0,
        total_pods: 0
      };
    }
  },

  /**
   * Fetch real live Kubernetes Workloads (Deployments, Services, Pods, Namespaces)
   */
  async getClusterWorkloads() {
    try {
      const response = await fetch(`${this.baseUrl}/api/cluster/workloads/`, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout ? AbortSignal.timeout(6000) : undefined
      });
      if (response.ok) {
        return await response.json();
      }
      return {
        connected: false,
        error: `Server responded with status ${response.status}`,
        deployments: [],
        services: [],
        pods: [],
        namespaces: []
      };
    } catch (err) {
      return {
        connected: false,
        error: err.message,
        deployments: [],
        services: [],
        pods: [],
        namespaces: []
      };
    }
  },

  /**
   * Fetch real live Kubernetes cluster events
   */
  async getClusterEvents() {
    try {
      const response = await fetch(`${this.baseUrl}/api/cluster/events/`, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout ? AbortSignal.timeout(6000) : undefined
      });
      if (response.ok) {
        return await response.json();
      }
      return { connected: false, error: `Status ${response.status}`, events: [] };
    } catch (err) {
      return { connected: false, error: err.message, events: [] };
    }
  },

  /**
   * Fetch 5-Instance VPC & Aurora RDS Infrastructure Spec
   */
  async getInfrastructureSpec() {
    try {
      const response = await fetch(`${this.baseUrl}/api/cluster/infrastructure/`, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout ? AbortSignal.timeout(6000) : undefined
      });
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (err) {
      console.warn('Failed to fetch infrastructure spec:', err.message);
      return null;
    }
  },


  /**
   * Test arbitrary endpoint with custom method & payload
   */
  async sendCustomRequest({ method, path, headers, body }) {
    const startTime = performance.now();
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    const url = `${this.baseUrl}${cleanPath}`;

    const reqOptions = {
      method: method || 'GET',
      headers: {
        'Accept': 'application/json',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(headers || {})
      }
    };

    if (body && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
      reqOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
    }

    try {
      const res = await fetch(url, {
        ...reqOptions,
        signal: AbortSignal.timeout ? AbortSignal.timeout(8000) : undefined
      });
      const latency = Math.round(performance.now() - startTime);
      
      let resBody = null;
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        resBody = await res.json();
      } else {
        resBody = await res.text();
      }

      return {
        ok: res.ok,
        status: res.status,
        statusText: res.statusText,
        latency,
        headers: Object.fromEntries(res.headers.entries()),
        data: resBody,
        url
      };
    } catch (error) {
      const latency = Math.round(performance.now() - startTime);
      return {
        ok: false,
        status: 0,
        statusText: 'Network Error / Blocked',
        latency,
        headers: {},
        error: error.message,
        url
      };
    }
  }
};

