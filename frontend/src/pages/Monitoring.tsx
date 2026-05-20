import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { 
  FiActivity, FiCpu, FiHardDrive, FiClock, FiTrendingUp, 
  FiRefreshCw, FiServer, FiDatabase, FiBarChart2
} from 'react-icons/fi';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface SystemMetrics {
  timestamp: string;
  process: {
    pid: number;
    cpu: number;
    memory: {
      rss: number;
      heapTotal: number;
      heapUsed: number;
      external: number;
    };
    uptime: number;
    versions?: {
      node: string;
      v8?: string;
      [key: string]: string | undefined;
    };
  };
  system: {
    platform: string;
    arch: string;
    cpus: number;
    loadAverage: number[];
    totalMemory: number;
    freeMemory: number;
    memoryUsagePercent: number;
    uptime: number;
  };
}

interface RequestStats {
  total: number;
  lastHour: { count: number; avgResponseTime: number };
  lastDay: { count: number; avgResponseTime: number };
}

const Monitoring: React.FC = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [requestStats, setRequestStats] = useState<RequestStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [history, setHistory] = useState<number[]>([]);
  const [historyLabels, setHistoryLabels] = useState<string[]>([]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      if (autoRefresh) {
        fetchData();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const fetchData = async () => {
    try {
      const [metricsRes, statsRes] = await Promise.all([
        api.get('/monitoring/metrics'),
        api.get('/monitoring/requests')
      ]);
      setMetrics(metricsRes.data);
      setRequestStats(statsRes.data);
      
      setHistory(prev => {
        const newHistory = [...prev, metricsRes.data.process.cpu];
        if (newHistory.length > 30) newHistory.shift();
        return newHistory;
      });
      setHistoryLabels(prev => {
        const newLabels = [...prev, new Date().toLocaleTimeString()];
        if (newLabels.length > 30) newLabels.shift();
        return newLabels;
      });
    } catch (error) {
      console.error('Erreur chargement monitoring', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${days}d ${hours}h ${minutes}m ${secs}s`;
  };

  const getNodeVersion = () => {
    const versions = metrics?.process.versions;
    if (versions && versions.node) {
      return versions.node;
    }
    return process.versions?.node || 'Inconnue';
  };

  const cpuChartData = {
    labels: historyLabels,
    datasets: [
      {
        label: 'CPU (%)',
        data: history,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  if (user?.role !== 'admin') {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Accès non autorisé. Seuls les administrateurs peuvent accéder au monitoring.
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="text-center py-10">Chargement...</div>;
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-2">
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <FiActivity className="text-blue-600" /> Monitoring système
        </h1>
        <div className="flex gap-2 items-center">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            Auto-raffraîchissement (5s)
          </label>
          <button
            onClick={fetchData}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2"
          >
            <FiRefreshCw /> Rafraîchir
          </button>
        </div>
      </div>

      {/* Processus */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-dark-card rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-2">
            <FiCpu className="text-blue-500 text-xl" />
            <span className="text-xs text-gray-500">Processus</span>
          </div>
          <p className="text-2xl font-bold">{metrics?.process.cpu.toFixed(1)}%</p>
          <p className="text-sm text-gray-500">CPU</p>
        </div>
        <div className="bg-white dark:bg-dark-card rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-2">
            <FiHardDrive className="text-green-500 text-xl" />
            <span className="text-xs text-gray-500">Mémoire</span>
          </div>
          <p className="text-2xl font-bold">{formatBytes(metrics?.process.memory.heapUsed || 0)}</p>
          <p className="text-sm text-gray-500">Heap utilisé</p>
        </div>
        <div className="bg-white dark:bg-dark-card rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-2">
            <FiClock className="text-yellow-500 text-xl" />
            <span className="text-xs text-gray-500">Uptime</span>
          </div>
          <p className="text-2xl font-bold">{formatDuration(metrics?.process.uptime || 0)}</p>
          <p className="text-sm text-gray-500">Processus</p>
        </div>
        <div className="bg-white dark:bg-dark-card rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-2">
            <FiTrendingUp className="text-purple-500 text-xl" />
            <span className="text-xs text-gray-500">Requêtes</span>
          </div>
          <p className="text-2xl font-bold">{requestStats?.total || 0}</p>
          <p className="text-sm text-gray-500">Total requêtes</p>
        </div>
      </div>

      {/* Graphique CPU */}
      <div className="bg-white dark:bg-dark-card rounded-lg shadow p-4 mb-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <FiBarChart2 /> Évolution CPU (30 dernières mesures)
        </h2>
        <div style={{ height: '300px' }}>
          <Line data={cpuChartData} options={{ responsive: true, maintainAspectRatio: false }} />
        </div>
      </div>

      {/* Système */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white dark:bg-dark-card rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FiServer /> Système
          </h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Plateforme:</span>
              <span>{metrics?.system.platform} {metrics?.system.arch}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">CPUs:</span>
              <span>{metrics?.system.cpus}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Charge moyenne:</span>
              <span>{metrics?.system.loadAverage.map(l => l.toFixed(2)).join(', ')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Mémoire totale:</span>
              <span>{formatBytes(metrics?.system.totalMemory || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Mémoire libre:</span>
              <span>{formatBytes(metrics?.system.freeMemory || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Utilisation mémoire:</span>
              <span className={metrics?.system.memoryUsagePercent > 80 ? 'text-red-500' : ''}>
                {metrics?.system.memoryUsagePercent.toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Uptime système:</span>
              <span>{formatDuration(metrics?.system.uptime || 0)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-dark-card rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FiDatabase /> Statistiques requêtes
          </h2>
          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <p className="text-sm text-gray-500">Dernière heure</p>
              <p className="text-2xl font-bold">{requestStats?.lastHour.count || 0}</p>
              <p className="text-sm">requêtes - moyenne {requestStats?.lastHour.avgResponseTime.toFixed(0)}ms</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <p className="text-sm text-gray-500">Dernier jour</p>
              <p className="text-2xl font-bold">{requestStats?.lastDay.count || 0}</p>
              <p className="text-sm">requêtes - moyenne {requestStats?.lastDay.avgResponseTime.toFixed(0)}ms</p>
            </div>
            <div className="mt-2 text-xs text-gray-400">
              <p>⚠️ Requêtes lentes &gt; 1s sont enregistrées dans les logs</p>
            </div>
          </div>
        </div>
      </div>

      {/* Process details */}
      <div className="bg-white dark:bg-dark-card rounded-lg shadow p-4">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <FiActivity /> Détails du processus
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-500">PID</p>
            <p className="font-mono">{metrics?.process.pid}</p>
          </div>
          <div>
            <p className="text-gray-500">Node.js</p>
            <p className="font-mono">{getNodeVersion()}</p>
          </div>
          <div>
            <p className="text-gray-500">Mémoire RSS</p>
            <p className="font-mono">{formatBytes(metrics?.process.memory.rss || 0)}</p>
          </div>
          <div>
            <p className="text-gray-500">Heap total</p>
            <p className="font-mono">{formatBytes(metrics?.process.memory.heapTotal || 0)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Monitoring;