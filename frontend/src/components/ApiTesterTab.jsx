import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { apiService } from '../services/api';
import { 
  Send, 
  Terminal, 
  Clock, 
  Copy, 
  Check, 
  Sparkles, 
  Code2, 
  FileJson, 
  PlayCircle,
  RotateCcw,
  AlertCircle
} from 'lucide-react';

const QUICK_ENDPOINTS = [
  { label: 'Health Check', method: 'GET', path: '/api/health/', body: '' },
  { label: 'List All Items', method: 'GET', path: '/api/items/', body: '' },
  { 
    label: 'Create Item', 
    method: 'POST', 
    path: '/api/items/', 
    body: JSON.stringify({ name: 'Ingress Controller Pod', description: 'TLS cert-manager & ALB ingress' }, null, 2) 
  },
  { label: 'Get Item #1', method: 'GET', path: '/api/items/1/', body: '' }
];

export default function ApiTesterTab() {
  const { apiUrl, addLog, addToast } = useApp();

  const [method, setMethod] = useState('GET');
  const [path, setPath] = useState('/api/health/');
  const [requestBody, setRequestBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('body'); // 'body' | 'headers'
  const [history, setHistory] = useState([]);

  const handleQuickSelect = (endpoint) => {
    setMethod(endpoint.method);
    setPath(endpoint.path);
    setRequestBody(endpoint.body);
  };

  const handleSend = async () => {
    setLoading(true);
    setResponse(null);

    let parsedBody = null;
    if (requestBody && ['POST', 'PUT', 'PATCH'].includes(method)) {
      try {
        parsedBody = JSON.parse(requestBody);
      } catch (err) {
        addToast('JSON Syntax Error', 'Request body contains invalid JSON.', 'error');
        setLoading(false);
        return;
      }
    }

    try {
      const res = await apiService.sendCustomRequest({
        method,
        path,
        body: parsedBody
      });

      setResponse(res);
      addLog(`${method} ${path} -> Status ${res.status} (${res.latency}ms)`, res.ok ? 'SUCCESS' : 'WARN', 'ApiTester');

      setHistory(prev => [
        {
          id: Date.now(),
          method,
          path,
          status: res.status,
          latency: res.latency,
          timestamp: new Date().toLocaleTimeString()
        },
        ...prev.slice(0, 7)
      ]);
    } catch (error) {
      setResponse({
        ok: false,
        status: 0,
        statusText: error.message,
        latency: 0,
        headers: {},
        error: error.message,
        url: `${apiUrl}${path}`
      });
      addLog(`API Tester request failed: ${error.message}`, 'ERROR', 'ApiTester');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyResponse = () => {
    if (!response) return;
    const content = typeof response.data === 'string' ? response.data : JSON.stringify(response.data, null, 2);
    navigator.clipboard.writeText(content);
    setCopied(true);
    addToast('Copied to Clipboard', 'Response content copied.', 'info');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-black text-white tracking-tight">
            Interactive REST API Tester
          </h2>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            HTTP Playground
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Execute live HTTP calls against Django API endpoints at <code className="text-cyan-300 font-mono">{apiUrl}</code>
        </p>
      </div>

      {/* Quick Templates */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-slate-500 font-semibold uppercase tracking-wider text-[10px] mr-1">
          Templates:
        </span>
        {QUICK_ENDPOINTS.map((endpoint, idx) => (
          <button
            key={idx}
            onClick={() => handleQuickSelect(endpoint)}
            className="px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-300 transition-all whitespace-nowrap flex items-center gap-1.5"
          >
            <span className={`text-[10px] font-bold font-mono px-1.5 py-0.2 rounded ${
              endpoint.method === 'GET' ? 'text-cyan-400 bg-cyan-500/10' : 'text-indigo-400 bg-indigo-500/10'
            }`}>
              {endpoint.method}
            </span>
            <span>{endpoint.label}</span>
          </button>
        ))}
      </div>

      {/* Request Builder Box */}
      <div className="p-5 rounded-2xl bg-[#111726]/80 backdrop-blur-xl border border-slate-800/90 shadow-xl space-y-4">
        {/* Method + Path + Send */}
        <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-cyan-400 font-mono font-bold text-sm focus:outline-none focus:border-cyan-400 shrink-0"
          >
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="DELETE">DELETE</option>
            <option value="PATCH">PATCH</option>
          </select>

          <div className="flex-1 relative flex items-center">
            <span className="absolute left-3 text-xs text-slate-500 font-mono hidden md:inline">
              {apiUrl}
            </span>
            <input
              type="text"
              value={path}
              onChange={(e) => setPath(e.target.value)}
              placeholder="/api/health/"
              className="w-full pl-3 md:pl-56 pr-4 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-slate-100 font-mono text-sm focus:outline-none focus:border-cyan-400"
            />
          </div>

          <button
            onClick={handleSend}
            disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-bold text-sm shadow-lg shadow-cyan-500/25 transition-all flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            <span>{loading ? 'Sending...' : 'Send Request'}</span>
          </button>
        </div>

        {/* JSON Request Body (if POST/PUT/PATCH) */}
        {['POST', 'PUT', 'PATCH'].includes(method) && (
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
              JSON Request Body
            </label>
            <textarea
              value={requestBody}
              onChange={(e) => setRequestBody(e.target.value)}
              placeholder='{\n  "name": "Sample item",\n  "description": "Details..."\n}'
              rows={4}
              className="w-full px-4 py-3 bg-slate-900/95 border border-slate-700/80 rounded-xl text-cyan-300 font-mono text-xs focus:outline-none focus:border-cyan-400 resize-y"
            />
          </div>
        )}
      </div>

      {/* Response Panel */}
      {response && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 rounded-2xl bg-[#111726]/90 border border-slate-800/90 shadow-2xl space-y-4"
        >
          {/* Response Status Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-xl text-xs font-bold font-mono ${
                response.ok 
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' 
                  : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
              }`}>
                {response.status ? `${response.status} ${response.statusText}` : 'Connection Failed'}
              </span>

              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span>Time: <strong className="text-slate-200 font-mono">{response.latency}ms</strong></span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex rounded-lg bg-slate-900 border border-slate-700 p-0.5 text-xs">
                <button
                  onClick={() => setActiveTab('body')}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    activeTab === 'body' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400'
                  }`}
                >
                  Response Body
                </button>
                <button
                  onClick={() => setActiveTab('headers')}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    activeTab === 'headers' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400'
                  }`}
                >
                  Headers
                </button>
              </div>

              <button
                onClick={handleCopyResponse}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white transition-colors"
                title="Copy Response"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Response Body Content */}
          {activeTab === 'body' ? (
            <div className="relative">
              <pre className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 text-cyan-300 font-mono text-xs overflow-x-auto max-h-96 leading-relaxed">
                {response.data ? JSON.stringify(response.data, null, 2) : response.error || 'Empty Response Body'}
              </pre>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 font-mono text-xs space-y-1.5 text-slate-300 max-h-96 overflow-y-auto">
              {Object.entries(response.headers || {}).length > 0 ? (
                Object.entries(response.headers).map(([k, v]) => (
                  <div key={k} className="flex gap-2">
                    <span className="text-cyan-400 font-semibold">{k}:</span>
                    <span className="text-slate-300">{v}</span>
                  </div>
                ))
              ) : (
                <div className="text-slate-500 italic">No headers captured</div>
              )}
            </div>
          )}
        </motion.div>
      )}

      {/* History Table */}
      {history.length > 0 && (
        <div className="p-5 rounded-2xl bg-[#111726]/60 border border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <RotateCcw className="w-3.5 h-3.5 text-cyan-400" /> Recent In-Session Requests
            </h4>
            <span className="text-[11px] text-slate-500">{history.length} records</span>
          </div>

          <div className="space-y-1.5">
            {history.map((req) => (
              <div
                key={req.id}
                onClick={() => {
                  setMethod(req.method);
                  setPath(req.path);
                }}
                className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/30 cursor-pointer flex items-center justify-between text-xs transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className={`font-mono font-bold px-1.5 py-0.5 rounded text-[10px] ${
                    req.method === 'GET' ? 'bg-cyan-500/10 text-cyan-400' : 'bg-indigo-500/10 text-indigo-400'
                  }`}>
                    {req.method}
                  </span>
                  <span className="font-mono text-slate-200">{req.path}</span>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`font-mono font-semibold ${req.status >= 200 && req.status < 300 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    HTTP {req.status}
                  </span>
                  <span className="text-slate-500 font-mono">{req.latency}ms</span>
                  <span className="text-slate-500">{req.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
