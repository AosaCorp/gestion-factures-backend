const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  category: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'Général'
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  taxRate: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 19.25
  },
  type: {
    type: DataTypes.ENUM('product', 'service'),
    defaultValue: 'product'
  },
  stock: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  minStock: {
    type: DataTypes.INTEGER,
    defaultValue: 5,
    comment: 'Seuil d\'alerte pour le stock bas'
  },
  alertSent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Alerte de stock bas déjà envoyée'
  }
}, {
  timestamps: true
});

module.exports = Product;