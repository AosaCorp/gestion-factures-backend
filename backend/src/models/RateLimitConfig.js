const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const RateLimitConfig = sequelize.define('RateLimitConfig', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  windowMs: {
    type: DataTypes.INTEGER,
    defaultValue: 15 * 60 * 1000,
    comment: 'Fenêtre en millisecondes'
  },
  max: {
    type: DataTypes.INTEGER,
    defaultValue: 100,
    comment: 'Nombre maximum de requêtes'
  },
  enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  timestamps: true,
  tableName: 'RateLimitConfigs'
});

module.exports = RateLimitConfig;