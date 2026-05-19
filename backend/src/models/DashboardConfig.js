const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DashboardConfig = sequelize.define('DashboardConfig', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  widgets: {
    type: DataTypes.JSON,
    defaultValue: [
      { id: 'stats', title: 'Statistiques', type: 'stats', position: 0, enabled: true, size: 'full' },
      { id: 'chart', title: 'Évolution', type: 'chart', position: 1, enabled: true, size: 'half' },
      { id: 'payments', title: 'Paiements', type: 'payments', position: 2, enabled: true, size: 'half' },
      { id: 'top-products', title: 'Top produits', type: 'topProducts', position: 3, enabled: true, size: 'half' },
      { id: 'recent-invoices', title: 'Dernières factures', type: 'recentInvoices', position: 4, enabled: true, size: 'full' },
      { id: 'alerts', title: 'Alertes', type: 'alerts', position: 5, enabled: true, size: 'half' }
    ],
    comment: 'Configuration des widgets du tableau de bord'
  },
  layout: {
    type: DataTypes.JSON,
    defaultValue: {
      columns: 2,
      gap: 16
    }
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  timestamps: true,
  tableName: 'DashboardConfigs'
});

module.exports = DashboardConfig;