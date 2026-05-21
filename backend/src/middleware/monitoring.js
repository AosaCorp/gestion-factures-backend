const monitoringService = require('../services/monitoringService');

/**
 * Middleware pour surveiller les performances des requêtes
 */
const performanceMonitor = (req, res, next) => {
  const start = Date.now();
  
  // Capturer la réponse originale
  const originalSend = res.send;
  const originalJson = res.json;
  
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
  
  res.json = function(data) {
    const duration = Date.now() - start;
    
    monitoringService.recordRequest(duration, res.statusCode);
    
    if (duration > 1000) {
      console.log(`⚠️ Requête lente: ${req.method} ${req.url} - ${duration}ms`);
    }
    
    return originalJson.call(this, data);
  };
  
  next();
};

/**
 * Middleware pour ajouter des en-têtes de monitoring
 */
const monitoringHeaders = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    // Vérifier que les en-têtes n'ont pas déjà été envoyés
    if (!res.headersSent) {
      const duration = Date.now() - start;
      res.setHeader('X-Response-Time', `${duration}ms`);
    }
  });
  
  next();
};

/**
 * Met à jour les métriques en temps réel via WebSocket
 */
const updateMetricsWebSocket = async (io) => {
  setInterval(async () => {
    try {
      const metrics = await monitoringService.getAllMetrics();
      if (io) {
        io.emit('monitoring_update', metrics);
      }
    } catch (err) {
      console.error('Erreur mise à jour WebSocket monitoring:', err);
    }
  }, 5000);
};

module.exports = {
  performanceMonitor,
  monitoringHeaders,
  updateMetricsWebSocket
};