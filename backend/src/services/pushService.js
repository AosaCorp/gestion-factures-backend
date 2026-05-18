const webpush = require('web-push');
const { PushSubscription } = require('../models');

// Configuration VAPID
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || 'mailto:admin@example.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

/**
 * Envoie une notification push à un utilisateur spécifique
 */
const sendNotificationToUser = async (userId, title, body, data = {}, icon = '/logo.png') => {
  try {
    const subscriptions = await PushSubscription.findAll({
      where: { userId, active: true }
    });
    
    if (subscriptions.length === 0) return { success: false, message: 'Aucun abonnement' };
    
    const payload = JSON.stringify({
      title,
      body,
      icon,
      data: {
        url: data.url || '/',
        ...data
      },
      timestamp: Date.now()
    });
    
    const results = [];
    for (const subscription of subscriptions) {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: subscription.keys
          },
          payload
        );
        results.push({ success: true, endpoint: subscription.endpoint });
      } catch (error) {
        console.error('Erreur envoi notification:', error);
        // Si la subscription est expirée, la désactiver
        if (error.statusCode === 410) {
          await subscription.update({ active: false });
        }
        results.push({ success: false, endpoint: subscription.endpoint, error: error.message });
      }
    }
    
    return { success: results.some(r => r.success), results };
  } catch (error) {
    console.error('Erreur envoi notification:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Envoie une notification à tous les utilisateurs (admin seulement)
 */
const sendNotificationToAll = async (title, body, data = {}, icon = '/logo.png') => {
  try {
    const subscriptions = await PushSubscription.findAll({ where: { active: true } });
    
    const payload = JSON.stringify({
      title,
      body,
      icon,
      data,
      timestamp: Date.now()
    });
    
    const results = [];
    for (const subscription of subscriptions) {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: subscription.keys
          },
          payload
        );
        results.push({ success: true });
      } catch (error) {
        if (error.statusCode === 410) {
          await subscription.update({ active: false });
        }
        results.push({ success: false, error: error.message });
      }
    }
    
    return { success: results.some(r => r.success), results };
  } catch (error) {
    console.error('Erreur envoi notification massive:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Sauvegarde un abonnement push
 */
const saveSubscription = async (userId, subscription, userAgent) => {
  try {
    // Vérifier si l'abonnement existe déjà
    const existing = await PushSubscription.findOne({
      where: { endpoint: subscription.endpoint }
    });
    
    if (existing) {
      await existing.update({
        keys: subscription.keys,
        userAgent,
        active: true
      });
      return existing;
    }
    
    const newSubscription = await PushSubscription.create({
      userId,
      endpoint: subscription.endpoint,
      keys: subscription.keys,
      userAgent,
      active: true
    });
    
    return newSubscription;
  } catch (error) {
    console.error('Erreur sauvegarde abonnement:', error);
    throw error;
  }
};

/**
 * Supprime un abonnement
 */
const deleteSubscription = async (endpoint) => {
  try {
    await PushSubscription.destroy({ where: { endpoint } });
    return { success: true };
  } catch (error) {
    console.error('Erreur suppression abonnement:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendNotificationToUser,
  sendNotificationToAll,
  saveSubscription,
  deleteSubscription
};