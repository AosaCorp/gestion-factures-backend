const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const process = require('process');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/config.json')[env];
const db = {};

let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}

// Importer tous les modèles
const Client = require('./Client');
const Product = require('./Product');
const User = require('./User');
const Invoice = require('./Invoice');
const Payment = require('./Payment');
const Company = require('./Company');
const Reminder = require('./Reminder');

// Initialiser les modèles
const models = {
  Client,
  Product,
  User,
  Invoice,
  Payment,
  Company,
  Reminder
};

// Associer les modèles
Object.values(models).forEach(model => {
  if (model.associate) {
    model.associate(models);
  }
});

// Associations manuelles
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

// Associations pour Reminder
if (Invoice && Reminder) {
  Invoice.hasMany(Reminder, { foreignKey: 'invoiceId', as: 'reminders' });
  Reminder.belongsTo(Invoice, { foreignKey: 'invoiceId', as: 'invoice' });
}

db.sequelize = sequelize;
db.Sequelize = Sequelize;

// Ajouter tous les modèles à db
Object.keys(models).forEach(modelName => {
  db[modelName] = models[modelName];
});

module.exports = db;