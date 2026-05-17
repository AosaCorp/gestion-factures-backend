const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const crypto = require('crypto');

const ApiKey = sequelize.define('ApiKey', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Nom de l\'application/client'
  },
  key: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  permissions: {
    type: DataTypes.JSON,
    defaultValue: {
      invoices: { read: true, write: true },
      clients: { read: true, write: true },
      products: { read: true, write: true },
      payments: { read: true, write: false },
      reports: { read: true, write: false }
    },
    comment: 'Permissions par module'
  },
  status: {
    type: DataTypes.ENUM('active', 'disabled', 'expired'),
    defaultValue: 'active'
  },
  lastUsedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Date d\'expiration (optionnelle)'
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
  tableName: 'ApiKeys',
  hooks: {
    beforeCreate: (apiKey) => {
      // Générer une clé API unique si elle n'existe pas
      if (!apiKey.key) {
        apiKey.key = `pk_live_${crypto.randomBytes(32).toString('hex')}`;
      }
    },
    beforeBulkCreate: (apiKeys) => {
      apiKeys.forEach(apiKey => {
        if (!apiKey.key) {
          apiKey.key = `pk_live_${crypto.randomBytes(32).toString('hex')}`;
        }
      });
    }
  }
});

module.exports = ApiKey;