const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Reminder = sequelize.define('Reminder', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  invoiceId: { type: DataTypes.INTEGER, allowNull: false },
  reminderType: { type: DataTypes.ENUM('first', 'second', 'third', 'final'), defaultValue: 'first' },
  status: { type: DataTypes.ENUM('pending', 'sent', 'failed'), defaultValue: 'pending' },
  scheduledDate: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  sentDate: DataTypes.DATE,
  errorMessage: DataTypes.TEXT
}, { timestamps: true, tableName: 'Reminders' });

module.exports = Reminder;