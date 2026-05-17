const { Log } = require('../models');

/**
 * Middleware pour enregistrer les actions dans les logs
 * @param {string} action - Nom de l'action (ex: CREATE_CLIENT, UPDATE_INVOICE)
 * @param {string} entityType - Type d'entité (client, product, invoice, payment, user)
 */
const auditLog = (action, entityType = null) => {
  return async (req, res, next) => {
    // Sauvegarder la méthode originale res.json
    const originalJson = res.json;
    
    // Surcharger res.json pour capturer la réponse
    res.json = function(data) {
      // Restaurer la méthode originale
      res.json = originalJson;
      
      // Enregistrer le log de manière asynchrone (ne bloque pas la réponse)
      setTimeout(async () => {
        try {
          // Extraire l'ID de l'entité si possible
          let entityId = null;
          if (data && data.id) {
            entityId = data.id;
          } else if (data && data.data && data.data.id) {
            entityId = data.data.id;
          } else if (req.params.id) {
            entityId = parseInt(req.params.id);
          }
          
          await Log.create({
            action,
            entityType,
            entityId,
            details: {
              body: req.body,
              params: req.params,
              query: req.query,
              response: data
            },
            ip: req.ip || req.connection?.remoteAddress,
            userAgent: req.headers['user-agent'],
            userId: req.user?.id
          });
        } catch (err) {
          console.error('Erreur lors de l\'enregistrement du log:', err);
        }
      }, 0);
      
      // Appeler la méthode originale
      return originalJson.call(this, data);
    };
    
    next();
  };
};

/**
 * Middleware pour enregistrer simplement (sans capturer la réponse)
 */
const simpleAuditLog = (action, entityType = null) => {
  return async (req, res, next) => {
    try {
      await Log.create({
        action,
        entityType,
        details: {
          body: req.body,
          params: req.params,
          query: req.query
        },
        ip: req.ip || req.connection?.remoteAddress,
        userAgent: req.headers['user-agent'],
        userId: req.user?.id
      });
    } catch (err) {
      console.error('Erreur lors de l\'enregistrement du log:', err);
    }
    next();
  };
};

module.exports = { auditLog, simpleAuditLog };