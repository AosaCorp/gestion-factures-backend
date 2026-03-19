const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Company = sequelize.define('Company', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  address: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  phone: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  email: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  taxId: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  taxRate: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 19.25
  },
  logo: {
    type: DataTypes.STRING,
    defaultValue: ''
  }
}, {
  timestamps: true
});

module.exports = Company;