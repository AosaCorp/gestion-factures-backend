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
  description: DataTypes.STRING,
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
  }
}, {
  timestamps: true
});

module.exports = Product;