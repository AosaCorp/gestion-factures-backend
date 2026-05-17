const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Webhook = sequelize.define('Webhook', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Nom du webhook (ex: Slack, Discord, API externe)'
  },
  url: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isUrl: true
    },
    comment: 'URL de destination'
  },
  secret: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Secret pour signer les requêtes'
  },
  events: {
    type: DataTypes.JSON,
    defaultValue: [
      'invoice.created',
      'invoice.paid',
      'invoice.cancelled',
      'payment.received',
      'client.created',
      'product.created'
    ],
    comment: 'Liste des événements déclencheurs'
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'failed'),
    defaultValue: 'active'
  },
  lastTriggeredAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  lastError: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  retryCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
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
  tableName: 'Webhooks'
});

module.exports = Webhook;