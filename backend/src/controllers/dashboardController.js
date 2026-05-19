const { DashboardConfig } = require('../models');

// Récupérer la configuration du tableau de bord
exports.getConfig = async (req, res) => {
  try {
    let config = await DashboardConfig.findOne({
      where: { userId: req.user.id }
    });
    
    if (!config) {
      // Créer la configuration par défaut
      config = await DashboardConfig.create({
        userId: req.user.id,
        widgets: [
          { id: 'stats', title: 'Statistiques', type: 'stats', position: 0, enabled: true, size: 'full' },
          { id: 'chart', title: 'Évolution', type: 'chart', position: 1, enabled: true, size: 'half' },
          { id: 'payments', title: 'Répartition des paiements', type: 'payments', position: 2, enabled: true, size: 'half' },
          { id: 'top-products', title: 'Top produits', type: 'topProducts', position: 3, enabled: true, size: 'half' },
          { id: 'recent-invoices', title: 'Dernières factures', type: 'recentInvoices', position: 4, enabled: true, size: 'full' },
          { id: 'alerts', title: 'Alertes', type: 'alerts', position: 5, enabled: true, size: 'half' }
        ],
        layout: { columns: 2, gap: 16 }
      });
    }
    
    res.json(config);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Mettre à jour la configuration
exports.updateConfig = async (req, res) => {
  try {
    const { widgets, layout } = req.body;
    
    let config = await DashboardConfig.findOne({
      where: { userId: req.user.id }
    });
    
    if (!config) {
      config = await DashboardConfig.create({
        userId: req.user.id,
        widgets,
        layout
      });
    } else {
      await config.update({ widgets, layout });
    }
    
    res.json(config);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Réinitialiser la configuration par défaut
exports.resetConfig = async (req, res) => {
  try {
    const defaultWidgets = [
      { id: 'stats', title: 'Statistiques', type: 'stats', position: 0, enabled: true, size: 'full' },
      { id: 'chart', title: 'Évolution', type: 'chart', position: 1, enabled: true, size: 'half' },
      { id: 'payments', title: 'Répartition des paiements', type: 'payments', position: 2, enabled: true, size: 'half' },
      { id: 'top-products', title: 'Top produits', type: 'topProducts', position: 3, enabled: true, size: 'half' },
      { id: 'recent-invoices', title: 'Dernières factures', type: 'recentInvoices', position: 4, enabled: true, size: 'full' },
      { id: 'alerts', title: 'Alertes', type: 'alerts', position: 5, enabled: true, size: 'half' }
    ];
    
    await DashboardConfig.upsert({
      userId: req.user.id,
      widgets: defaultWidgets,
      layout: { columns: 2, gap: 16 }
    });
    
    const config = await DashboardConfig.findOne({
      where: { userId: req.user.id }
    });
    
    res.json(config);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Récupérer la liste des widgets disponibles
exports.getAvailableWidgets = async (req, res) => {
  const widgets = [
    { id: 'stats', name: 'Statistiques', description: 'Affiche les KPI principaux', icon: '📊', defaultSize: 'full' },
    { id: 'chart', name: 'Graphique d\'évolution', description: 'Affiche l\'évolution du CA', icon: '📈', defaultSize: 'half' },
    { id: 'payments', name: 'Répartition des paiements', description: 'Graphique des méthodes de paiement', icon: '💳', defaultSize: 'half' },
    { id: 'top-products', name: 'Top produits', description: 'Produits les plus vendus', icon: '🏆', defaultSize: 'half' },
    { id: 'recent-invoices', name: 'Dernières factures', description: 'Liste des dernières factures', icon: '📄', defaultSize: 'full' },
    { id: 'alerts', name: 'Alertes', description: 'Impayés et factures en attente', icon: '⚠️', defaultSize: 'half' },
    { id: 'top-clients', name: 'Top clients', description: 'Clients les plus fidèles', icon: '👥', defaultSize: 'half' },
    { id: 'weekly-trend', name: 'Tendance hebdomadaire', description: 'Évolution sur la semaine', icon: '📅', defaultSize: 'half' },
    { id: 'performance', name: 'Performance radar', description: 'Graphique radar des performances', icon: '🎯', defaultSize: 'half' }
  ];
  res.json(widgets);
};