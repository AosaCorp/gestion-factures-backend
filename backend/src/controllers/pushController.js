const pushService = require('../services/pushService');

/**
 * Sauvegarde un abonnement push
 */
exports.subscribe = async (req, res) => {
  try {
    const { subscription } = req.body;
    const userAgent = req.headers['user-agent'];
    
    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ error: 'Abonnement invalide' });
    }
    
    const result = await pushService.saveSubscription(req.user.id, subscription, userAgent);
    res.json({ success: true, subscription: result });
  } catch (error) {
    console.error('Erreur subscription:', error);
    res.status(500).json({ error: 'Erreur lors de l\'abonnement' });
  }
};

/**
 * Supprime un abonnement
 */
exports.unsubscribe = async (req, res) => {
  try {
    const { endpoint } = req.body;
    await pushService.deleteSubscription(endpoint);
    res.json({ success: true });
  } catch (error) {
    console.error('Erreur unsubscription:', error);
    res.status(500).json({ error: 'Erreur lors de la désinscription' });
  }
};

/**
 * Envoie une notification de test
 */
exports.testNotification = async (req, res) => {
  try {
    const { title, body } = req.body;
    const result = await pushService.sendNotificationToUser(
      req.user.id,
      title || 'Test de notification',
      body || 'Ceci est une notification de test',
      { url: '/' }
    );
    res.json(result);
  } catch (error) {
    console.error('Erreur test notification:', error);
    res.status(500).json({ error: 'Erreur lors de l\'envoi' });
  }
};

/**
 * Envoie une notification à tous (admin seulement)
 */
exports.broadcast = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Action réservée aux administrateurs' });
    }
    
    const { title, body, url } = req.body;
    const result = await pushService.sendNotificationToAll(
      title || 'Information importante',
      body || 'Nouvelle information disponible',
      { url: url || '/' }
    );
    res.json(result);
  } catch (error) {
    console.error('Erreur broadcast:', error);
    res.status(500).json({ error: 'Erreur lors de l\'envoi' });
  }
};

/**
 * Récupère les abonnements de l'utilisateur
 */
exports.getSubscriptions = async (req, res) => {
  try {
    const { PushSubscription } = require('../models');
    const subscriptions = await PushSubscription.findAll({
      where: { userId: req.user.id, active: true },
      attributes: ['id', 'userAgent', 'active', 'createdAt']
    });
    res.json(subscriptions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};