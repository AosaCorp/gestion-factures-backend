const { Payment, Invoice, User } = require('../models');
const sequelize = require('../config/database');
const { Op } = require('sequelize');

// Liste tous les paiements avec pagination et tri
exports.getPayments = async (req, res) => {
  try {
    const { page = 1, limit = 10, sort = 'createdAt', order = 'DESC' } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows } = await Payment.findAndCountAll({
      include: [
        { model: Invoice, include: [{ model: User, as: 'createdByUser', attributes: ['id', 'name'] }] },
        { model: User, as: 'receiver', attributes: ['id', 'name'] }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sort, order]],
      distinct: true
    });

    res.json({
      data: rows,
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / limit)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Enregistrer un paiement
exports.createPayment = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { invoiceId, amount, method, transactionId } = req.body;
    console.log('Création paiement:', { invoiceId, amount, method, transactionId });

    const invoice = await Invoice.findByPk(invoiceId, { transaction: t });
    if (!invoice) {
      await t.rollback();
      return res.status(404).json({ message: 'Facture non trouvée' });
    }
    if (invoice.status === 'paid') {
      await t.rollback();
      return res.status(400).json({ message: 'Facture déjà payée' });
    }
    if (invoice.status === 'cancelled') {
      await t.rollback();
      return res.status(400).json({ message: 'Facture annulée' });
    }

    const payments = await Payment.sum('amount', { where: { invoiceId }, transaction: t }) || 0;
    const remaining = parseFloat(invoice.total) - payments;
    console.log('Solde restant:', remaining, 'Montant proposé:', amount);

    // Tolérance pour les erreurs d'arrondi
    if (amount > remaining + 0.001) {
      await t.rollback();
      return res.status(400).json({ message: 'Le montant dépasse le solde dû' });
    }

    const payment = await Payment.create({
      invoiceId,
      amount,
      method,
      transactionId,
      receivedBy: req.user.id
    }, { transaction: t });

    const newTotalPaid = payments + amount;
    if (Math.abs(newTotalPaid - parseFloat(invoice.total)) < 0.01) {
      invoice.status = 'paid';
      invoice.paidAt = new Date();
      await invoice.save({ transaction: t });
    }

    await t.commit();
    res.status(201).json(payment);
  } catch (error) {
    await t.rollback();
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Récupérer les paiements d'une facture
exports.getPaymentsByInvoice = async (req, res) => {
  try {
    const payments = await Payment.findAll({
      where: { invoiceId: req.params.invoiceId },
      include: [{ model: User, as: 'receiver', attributes: ['id', 'name'] }],
      order: [['createdAt', 'DESC']]
    });
    res.json(payments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};