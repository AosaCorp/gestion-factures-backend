const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Reminder = sequelize.define('Reminder', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  invoiceId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Invoices',
      key: 'id'
    }
  },
  reminderType: {
    type: DataTypes.ENUM('first', 'second', 'third', 'final'),
    defaultValue: 'first'
  },
  status: {
    type: DataTypes.ENUM('pending', 'sent', 'failed'),
    defaultValue: 'pending'
  },
  scheduledDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  sentDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  errorMessage: {
    type: DataTypes.TEXT,
    allowNull: true
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
  tableName: 'Reminders'
});

module.exports = Reminder;