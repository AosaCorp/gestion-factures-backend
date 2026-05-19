const { Client, Invoice, Payment, Product } = require('../models');
const { Op } = require('sequelize');
const { emitToAll, emitToUser } = require('../socket');

// Cache des dernières métriques
let lastMetrics = null;
let lastUpdate = null;

/**
 * Récupère les métriques actuelles
 */
const getCurrentMetrics = async () => {
  try {
    const [clientsCount, invoicesCount, paymentsCount, totalRevenue, totalPayments] = await Promise.all([
      Client.count(),
      Invoice.count(),
      Payment.count(),
      Invoice.sum('total', { where: { status: 'paid' } }) || 0,
      Payment.sum('amount') || 0
    ]);

    const unpaid = totalRevenue - totalPayments;
    
    // Évolution par rapport à la dernière heure
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);
    
    const [newInvoices, newPayments, newRevenue] = await Promise.all([
      Invoice.count({ where: { createdAt: { [Op.gte]: oneHourAgo } } }),
      Payment.count({ where: { createdAt: { [Op.gte]: oneHourAgo } } }),
      Invoice.sum('total', { 
        where: { 
          status: 'paid',
          createdAt: { [Op.gte]: oneHourAgo }
        }
      }) || 0
    ]);

    return {
      clients: clientsCount,
      invoices: invoicesCount,
      payments: paymentsCount,
      totalRevenue,
      totalPayments,
      unpaid,
      trends: {
        newInvoices,
        newPayments,
        newRevenue
      },
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Erreur getCurrentMetrics:', error);
    return null;
  }
};

/**
 * Diffuse les métriques à tous les utilisateurs
 */
const broadcastMetrics = async () => {
  const metrics = await getCurrentMetrics();
  if (metrics) {
    lastMetrics = metrics;
    lastUpdate = new Date();
    emitToAll('metrics_update', metrics);
    console.log(`📊 Métriques diffusées: ${metrics.invoices} factures, ${metrics.payments} paiements`);
  }
  return metrics;
};

/**
 * Diffuse les métriques à un utilisateur spécifique
 */
const sendMetricsToUser = async (userId) => {
  const metrics = await getCurrentMetrics();
  if (metrics) {
    emitToUser(userId, 'metrics_update', metrics);
  }
  return metrics;
};

/**
 * Démarre le broadcasting périodique des métriques
 */
const startMetricsBroadcasting = (intervalMs = 30000) => {
  console.log(`📊 Broadcasting des métriques toutes les ${intervalMs / 1000} secondes`);
  
  // Premier broadcast immédiat
  setTimeout(() => broadcastMetrics(), 2000);
  
  // Broadcast périodique
  setInterval(broadcastMetrics, intervalMs);
  
  return { intervalMs };
};

module.exports = {
  getCurrentMetrics,
  broadcastMetrics,
  sendMetricsToUser,
  startMetricsBroadcasting
};