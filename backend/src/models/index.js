const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const process = require('process');
const basename = path.basename(__filename);
const sequelize = require('../config/database'); // Utiliser la connexion directe

const db = {};

// Importer tous les modèles
const Client = require('./Client');
const Product = require('./Product');
const User = require('./User');
const Invoice = require('./Invoice');
const Payment = require('./Payment');
const Company = require('./Company');
const Reminder = require('./Reminder');

// Initialiser les modèles avec sequelize
Client.init(sequelize);
Product.init(sequelize);
User.init(sequelize);
Invoice.init(sequelize);
Payment.init(sequelize);
Company.init(sequelize);
Reminder.init(sequelize);

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
const models = {
  Client,
  Product,
  User,
  Invoice,
  Payment,
  Company,
  Reminder
};

Object.keys(models).forEach(modelName => {
  db[modelName] = models[modelName];
});

module.exports = db;