const { Client, Product, Invoice, Payment } = require('../models');

exports.getStats = async (req, res) => {
  try {
    const clientsCount = await Client.count();
    const productsCount = await Product.count();
    const invoicesCount = await Invoice.count();
    const paymentsCount = await Payment.count();

    // Total des factures payées (chiffre d'affaires)
    const totalRevenue = await Invoice.sum('total', { where: { status: 'paid' } }) || 0;

    // Total des paiements effectués (encaissé)
    const totalPayments = await Payment.sum('amount') || 0;

    // Compter par statut
    const draftInvoices = await Invoice.count({ where: { status: 'draft' } });
    const paidInvoices = await Invoice.count({ where: { status: 'paid' } });
    const cancelledInvoices = await Invoice.count({ where: { status: 'cancelled' } });

    // Montant moyen des factures
    const allInvoices = await Invoice.findAll({ attributes: ['total'] });
    const sumTotal = allInvoices.reduce((acc, inv) => acc + parseFloat(inv.total), 0);
    const averageInvoice = allInvoices.length > 0 ? sumTotal / allInvoices.length : 0;

    // Total impayé = somme de toutes les factures - total des paiements
    const totalAllInvoices = await Invoice.sum('total') || 0;
    const totalUnpaid = totalAllInvoices - totalPayments;

    res.json({
      clients: clientsCount,
      products: productsCount,
      invoices: invoicesCount,
      payments: paymentsCount,
      totalRevenue,
      totalPayments,
      draftInvoices,
      paidInvoices,
      cancelledInvoices,
      averageInvoice,
      totalUnpaid
    });
  } catch (error) {
    console.error('Erreur stats:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};