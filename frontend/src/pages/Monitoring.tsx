import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { 
  FiActivity, FiCpu, FiHardDrive, FiClock, FiTrendingUp, 
  FiRefreshCw, FiServer, FiDatabase, FiBarChart2, FiAlertCircle
} from 'react-icons/fi';

interface SystemMetrics {
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
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  useEffect(() => {
    fetchData();
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(fetchData, 10000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const fetchData = async () => {
    try {
      setError(null);
      const [metricsRes, statsRes] = await Promise.all([
        api.get('/monitoring/metrics'),
        api.get('/monitoring/requests')
      ]);
      setMetrics(metricsRes.data);
      setRequestStats(statsRes.data);
    } catch (err: any) {
      console.error('Erreur chargement monitoring:', err);
      setError(err.message || 'Erreur de chargement');
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number) => {
    if (!seconds) return '0s';
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);
    return parts.join(' ');
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
    return (
      <div className="flex flex-col justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-600">Chargement des données de monitoring...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-96">
        <FiAlertCircle className="text-red-500 text-5xl mb-4" />
        <p className="text-red-600 mb-2">Erreur de chargement</p>
        <p className="text-gray-500 text-sm mb-4">{error}</p>
        <button
          onClick={fetchData}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Réessayer
        </button>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="flex flex-col justify-center items-center h-96">
        <p className="text-gray-500">Aucune donnée disponible</p>
        <button
          onClick={fetchData}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Rafraîchir
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-2">
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <FiActivity className="text-blue-600" /> Monitoring système
        </h1>
        <div className="flex gap-2 items-center">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            Auto-raffraîchissement (10s)
          </label>
          <button
            onClick={fetchData}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2"
          >
            <FiRefreshCw /> Rafraîchir
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-dark-card rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-2">
            <FiCpu className="text-blue-500 text-xl" />
            <span className="text-xs text-gray-500">CPU</span>
          </div>
          <p className="text-2xl font-bold">{metrics.process.cpu.toFixed(1)}%</p>
        </div>
        <div className="bg-white dark:bg-dark-card rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-2">
            <FiHardDrive className="text-green-500 text-xl" />
            <span className="text-xs text-gray-500">Mémoire</span>
          </div>
          <p className="text-2xl font-bold">{formatBytes(metrics.process.memory.heapUsed)}</p>
          <p className="text-xs text-gray-400">Heap utilisé</p>
        </div>
        <div className="bg-white dark:bg-dark-card rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-2">
            <FiClock className="text-yellow-500 text-xl" />
            <span className="text-xs text-gray-500">Uptime</span>
          </div>
          <p className="text-lg font-bold">{formatDuration(metrics.process.uptime)}</p>
          <p className="text-xs text-gray-400">Processus</p>
        </div>
        <div className="bg-white dark:bg-dark-card rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-2">
            <FiTrendingUp className="text-purple-500 text-xl" />
            <span className="text-xs text-gray-500">Requêtes</span>
          </div>
          <p className="text-2xl font-bold">{requestStats?.total || 0}</p>
          <p className="text-xs text-gray-400">Total</p>
        </div>
      </div>

      {/* Système */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white dark:bg-dark-card rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FiServer /> Système
          </h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between flex-wrap">
              <span className="text-gray-500">Plateforme:</span>
              <span className="font-mono">{metrics.system.platform} {metrics.system.arch}</span>
            </div>
            <div className="flex justify-between flex-wrap">
              <span className="text-gray-500">CPUs:</span>
              <span>{metrics.system.cpus}</span>
            </div>
            <div className="flex justify-between flex-wrap">
              <span className="text-gray-500">Charge moyenne:</span>
              <span>{metrics.system.loadAverage.map(l => l.toFixed(2)).join(', ')}</span>
            </div>
            <div className="flex justify-between flex-wrap">
              <span className="text-gray-500">Mémoire totale:</span>
              <span>{formatBytes(metrics.system.totalMemory)}</span>
            </div>
            <div className="flex justify-between flex-wrap">
              <span className="text-gray-500">Mémoire libre:</span>
              <span>{formatBytes(metrics.system.freeMemory)}</span>
            </div>
            <div className="flex justify-between flex-wrap">
              <span className="text-gray-500">Utilisation:</span>
              <span className={metrics.system.memoryUsagePercent > 80 ? 'text-red-500 font-bold' : ''}>
                {metrics.system.memoryUsagePercent.toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between flex-wrap">
              <span className="text-gray-500">Uptime système:</span>
              <span>{formatDuration(metrics.system.uptime)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-dark-card rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FiDatabase /> Requêtes
          </h2>
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4">
              <p className="text-sm text-gray-500">Dernière heure</p>
              <p className="text-3xl font-bold">{requestStats?.lastHour.count || 0}</p>
              <p className="text-sm mt-1">
                Temps moyen: <strong>{requestStats?.lastHour.avgResponseTime.toFixed(0)}ms</strong>
              </p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-4">
              <p className="text-sm text-gray-500">Dernier jour</p>
              <p className="text-3xl font-bold">{requestStats?.lastDay.count || 0}</p>
              <p className="text-sm mt-1">
                Temps moyen: <strong>{requestStats?.lastDay.avgResponseTime.toFixed(0)}ms</strong>
              </p>
            </div>
            <div className="text-xs text-gray-400 bg-gray-50 dark:bg-gray-800 p-2 rounded">
              💡 Les requêtes lentes (&gt; 1s) sont enregistrées dans les logs
            </div>
          </div>
        </div>
      </div>

      {/* Détails mémoire */}
      <div className="bg-white dark:bg-dark-card rounded-lg shadow p-4">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <FiActivity /> Mémoire détaillée
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-gray-500">RSS</p>
            <p className="font-mono font-bold">{formatBytes(metrics.process.memory.rss)}</p>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-gray-500">Heap total</p>
            <p className="font-mono font-bold">{formatBytes(metrics.process.memory.heapTotal)}</p>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-gray-500">Heap utilisé</p>
            <p className="font-mono font-bold">{formatBytes(metrics.process.memory.heapUsed)}</p>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-gray-500">External</p>
            <p className="font-mono font-bold">{formatBytes(metrics.process.memory.external)}</p>
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-400">
          <p>PID: <span className="font-mono">{metrics.process.pid}</span></p>
        </div>
      </div>
    </div>
  );
};

export default Monitoring;