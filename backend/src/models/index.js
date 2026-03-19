const User = require('./User');
const Client = require('./Client');
const Product = require('./Product');
const Invoice = require('./Invoice');
const Payment = require('./Payment');
const Log = require('./Log');
const Company = require('./Company');

// Relations avec alias
Invoice.belongsTo(Client, { as: 'client', foreignKey: 'clientId' });
Invoice.belongsTo(User, { as: 'createdByUser', foreignKey: 'createdBy' });
Invoice.hasMany(Payment, { foreignKey: 'invoiceId' });

// Ajout de l'association inverse
Client.hasMany(Invoice, { as: 'client', foreignKey: 'clientId' });

Payment.belongsTo(Invoice, { foreignKey: 'invoiceId' });
Payment.belongsTo(User, { as: 'receiver', foreignKey: 'receivedBy' });

Log.belongsTo(User, { foreignKey: 'userId' });

module.exports = {
  User,
  Client,
  Product,
  Invoice,
  Payment,
  Log,
  Company
};