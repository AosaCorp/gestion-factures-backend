const monitoringService = require('../services/monitoringService');

/**
 * Middleware pour surveiller les performances des requêtes
 */
const performanceMonitor = (req, res, next) => {
  const start = Date.now();
  
  // Capturer la réponse originale
  const originalSend = res.send;
  
  res.send = function(data) {
    const duration = Date.now() - start;
    
    // Enregistrer la requête
    monitoringService.recordRequest(duration, res.statusCode);
    
    // Log si la requête est lente (> 1 seconde)
    if (duration > 1000) {
      console.log(`⚠️ Requête lente: ${req.method} ${req.url} - ${duration}ms`);
    }
    
    // Appeler la méthode originale
    return originalSend.call(this, data);
  };
  
  next();
};

/**
 * Middleware pour ajouter des en-têtes de monitoring
 */
const monitoringHeaders = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    res.setHeader('X-Response-Time', `${duration}ms`);
  });
  
  next();
};

/**
 * Met à jour les métriques en temps réel via WebSocket
 */
const updateMetricsWebSocket = async (io) => {
  setInterval(async () => {
    const metrics = await monitoringService.getAllMetrics();
    if (io) {
      io.emit('monitoring_update', metrics);
    }
  }, 5000); // Toutes les 5 secondes
};

module.exports = {
  performanceMonitor,
  monitoringHeaders,
  updateMetricsWebSocket
};