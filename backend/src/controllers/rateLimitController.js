const RateLimitConfig = require('../models/RateLimitConfig');

// Récupérer toutes les configurations
exports.getConfigs = async (req, res) => {
  try {
    const configs = await RateLimitConfig.findAll();
    res.json(configs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Mettre à jour une configuration
exports.updateConfig = async (req, res) => {
  try {
    const { id } = req.params;
    const { windowMs, max, enabled } = req.body;
    
    const config = await RateLimitConfig.findByPk(id);
    if (!config) {
      return res.status(404).json({ error: 'Configuration non trouvée' });
    }
    
    await config.update({ windowMs, max, enabled });
    res.json(config);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Obtenir les statistiques de rate limiting
exports.getStats = async (req, res) => {
  try {
    // Cette fonction pourrait lire les données d'un cache Redis ou stockage
    // Pour l'instant, retourne des valeurs par défaut
    res.json({
      active: true,
      limits: [
        { name: 'API Générale', window: '15 minutes', max: 100 },
        { name: 'Authentification', window: '15 minutes', max: 5 },
        { name: 'API Publique', window: '1 minute', max: 30 },
        { name: 'Webhooks', window: '1 heure', max: 100 }
      ]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};