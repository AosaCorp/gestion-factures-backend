const os = require('os');
const pidusage = require('pidusage');

// Stockage des métriques historiques
const metricsHistory = {
  cpu: [],
  memory: [],
  requests: [],
  responseTime: []
};

const MAX_HISTORY = 100;

/**
 * Récupère les métriques système
 */
const getSystemMetrics = async () => {
  return new Promise((resolve) => {
    pidusage(process.pid, (err, stats) => {
      if (err) {
        console.error('Erreur pidusage:', err);
        resolve({
          cpu: 0,
          memory: 0,
          uptime: process.uptime()
        });
        return;
      }
      
      resolve({
        cpu: stats.cpu || 0,
        memory: stats.memory || 0,
        uptime: process.uptime()
      });
    });
  });
};

/**
 * Récupère les métriques de l'OS
 */
const getOSMetrics = () => {
  return {
    platform: os.platform(),
    arch: os.arch(),
    cpus: os.cpus().length,
    totalMemory: os.totalmem(),
    freeMemory: os.freemem(),
    loadAverage: os.loadavg(),
    uptime: os.uptime()
  };
};

/**
 * Récupère toutes les métriques
 */
const getAllMetrics = async () => {
  const [systemMetrics, osMetrics] = await Promise.all([
    getSystemMetrics(),
    Promise.resolve(getOSMetrics())
  ]);
  
  const memoryUsage = process.memoryUsage();
  
  return {
    timestamp: new Date().toISOString(),
    process: {
      pid: process.pid,
      cpu: systemMetrics.cpu,
      memory: {
        rss: memoryUsage.rss,
        heapTotal: memoryUsage.heapTotal,
        heapUsed: memoryUsage.heapUsed,
        external: memoryUsage.external
      },
      uptime: systemMetrics.uptime,
      versions: process.versions
    },
    system: {
      platform: osMetrics.platform,
      arch: osMetrics.arch,
      cpus: osMetrics.cpus,
      loadAverage: osMetrics.loadAverage,
      totalMemory: osMetrics.totalMemory,
      freeMemory: osMetrics.freeMemory,
      memoryUsagePercent: ((osMetrics.totalMemory - osMetrics.freeMemory) / osMetrics.totalMemory) * 100,
      uptime: osMetrics.uptime
    }
  };
};

/**
 * Enregistre une requête
 */
const recordRequest = (duration, status) => {
  metricsHistory.responseTime.push({
    timestamp: Date.now(),
    duration,
    status
  });
  
  if (metricsHistory.responseTime.length > MAX_HISTORY) {
    metricsHistory.responseTime.shift();
  }
};

/**
 * Récupère les statistiques des requêtes
 */
const getRequestStats = () => {
  const now = Date.now();
  const lastHour = metricsHistory.responseTime.filter(r => now - r.timestamp < 3600000);
  const lastDay = metricsHistory.responseTime.filter(r => now - r.timestamp < 86400000);
  
  const avgDuration = (arr) => arr.length ? arr.reduce((a, b) => a + b.duration, 0) / arr.length : 0;
  
  return {
    total: metricsHistory.responseTime.length,
    lastHour: {
      count: lastHour.length,
      avgResponseTime: avgDuration(lastHour)
    },
    lastDay: {
      count: lastDay.length,
      avgResponseTime: avgDuration(lastDay)
    }
  };
};

module.exports = {
  getAllMetrics,
  recordRequest,
  getRequestStats,
  metricsHistory
};