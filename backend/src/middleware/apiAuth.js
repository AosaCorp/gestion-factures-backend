const { ApiKey, User } = require('../models');

/**
 * Middleware d'authentification pour l'API publique
 * Vérifie la clé API dans le header 'X-API-Key'
 */
const apiAuth = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'];
    
    if (!apiKey) {
      return res.status(401).json({ 
        error: 'API Key manquante', 
        message: 'Veuillez fournir une clé API dans le header X-API-Key' 
      });
    }
    
    // Rechercher la clé API
    const keyRecord = await ApiKey.findOne({
      where: { key: apiKey },
      include: [{ model: User, as: 'user' }]
    });
    
    if (!keyRecord) {
      return res.status(401).json({ error: 'Clé API invalide' });
    }
    
    // Vérifier le statut
    if (keyRecord.status !== 'active') {
      return res.status(401).json({ error: 'Clé API désactivée ou expirée' });
    }
    
    // Vérifier l'expiration
    if (keyRecord.expiresAt && new Date() > keyRecord.expiresAt) {
      return res.status(401).json({ error: 'Clé API expirée' });
    }
    
    // Mettre à jour la date de dernière utilisation
    await keyRecord.update({ lastUsedAt: new Date() });
    
    // Ajouter les informations à la requête
    req.apiKey = keyRecord;
    req.user = keyRecord.user;
    
    next();
  } catch (error) {
    console.error('Erreur apiAuth:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
};

/**
 * Middleware pour vérifier les permissions
 * @param {string} module - Module concerné (invoices, clients, products, payments, reports)
 * @param {string} action - Action (read, write)
 */
const requirePermission = (module, action) => {
  return (req, res, next) => {
    const permissions = req.apiKey?.permissions || {};
    const modulePermissions = permissions[module] || {};
    
    if (modulePermissions[action]) {
      next();
    } else {
      res.status(403).json({ 
        error: 'Permission refusée',
        message: `Vous n'avez pas la permission ${action} sur le module ${module}`
      });
    }
  };
};

module.exports = { apiAuth, requirePermission };