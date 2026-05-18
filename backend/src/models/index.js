const sequelize = require('../config/database');
const Client = require('./Client');
const Product = require('./Product');
const User = require('./User');
const Invoice = require('./Invoice');
const Payment = require('./Payment');
const Company = require('./Company');
const Reminder = require('./Reminder');
const Log = require('./Log');
const ApiKey = require('./ApiKey');
const Webhook = require('./Webhook');
const DashboardConfig = require('./DashboardConfig');
const PushSubscription = require('./PushSubscription');

const db = {
  sequelize,
  Sequelize: require('sequelize'),
  Client,
  Product,
  User,
  Invoice,
  Payment,
  Company,
  Reminder,
  Log,
  ApiKey,
  Webhook,
  DashboardConfig,
  PushSubscription
};

// Associations
if (Invoice && Client) {
  Invoice.belongsTo(Client, { as: 'client', foreignKey: 'clientId' });
  Client.hasMany(Invoice, { as: 'invoices', foreignKey: 'clientId' });
}

if (Invoice && Payment) {
  Invoice.hasMany(Payment, { as: 'Payments', foreignKey: 'invoiceId' });
  Payment.belongsTo(Invoice, { as: 'Invoice', foreignKey: 'invoiceId' });
}

if (Payment && User) {
  Payment.belongsTo(User, { as: 'receiver', foreignKey: 'receivedBy' });
  User.hasMany(Payment, { as: 'Payments', foreignKey: 'receivedBy' });
}

if (Invoice && User) {
  Invoice.belongsTo(User, { as: 'createdByUser', foreignKey: 'createdBy' });
  User.hasMany(Invoice, { as: 'Invoices', foreignKey: 'createdBy' });
}

if (Invoice && Reminder) {
  Invoice.hasMany(Reminder, { foreignKey: 'invoiceId', as: 'reminders' });
  Reminder.belongsTo(Invoice, { foreignKey: 'invoiceId', as: 'invoice' });
}

if (Log && User) {
  Log.belongsTo(User, { as: 'user', foreignKey: 'userId' });
  User.hasMany(Log, { as: 'logs', foreignKey: 'userId' });
}

if (ApiKey && User) {
  ApiKey.belongsTo(User, { as: 'user', foreignKey: 'userId' });
  User.hasMany(ApiKey, { as: 'apiKeys', foreignKey: 'userId' });
}

if (Webhook && User) {
  Webhook.belongsTo(User, { as: 'user', foreignKey: 'userId' });
  User.hasMany(Webhook, { as: 'webhooks', foreignKey: 'userId' });
}

if (DashboardConfig && User) {
  DashboardConfig.belongsTo(User, { as: 'user', foreignKey: 'userId' });
  User.hasOne(DashboardConfig, { as: 'dashboardConfig', foreignKey: 'userId' });
}

if (PushSubscription && User) {
  PushSubscription.belongsTo(User, { as: 'user', foreignKey: 'userId' });
  User.hasMany(PushSubscription, { as: 'subscriptions', foreignKey: 'userId' });
}

module.exports = db;