const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Invoice = sequelize.define('Invoice', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  number: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  items: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: []
  },
  subtotal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  taxTotal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('draft', 'paid', 'cancelled'),
    defaultValue: 'draft'
  },
  paidAt: {
    type: DataTypes.DATE
  }
}, {
  timestamps: true
});

module.exports = Invoice;