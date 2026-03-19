const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Log = sequelize.define('Log', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  action: {
    type: DataTypes.STRING,
    allowNull: false
  },
  details: {
    type: DataTypes.JSON
  },
  ip: {
    type: DataTypes.STRING
  }
}, {
  timestamps: true
});

module.exports = Log;