const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Payment = sequelize.define('Payment', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  method: {
    type: DataTypes.ENUM('cash', 'orange_money', 'mtn_money'),
    allowNull: false
  },
  transactionId: {
    type: DataTypes.STRING
  },
  phoneNumber: {
    type: DataTypes.STRING,
    allowNull: true
  },
  receivedBy: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  }
}, {
  timestamps: true
});

module.exports = Payment;