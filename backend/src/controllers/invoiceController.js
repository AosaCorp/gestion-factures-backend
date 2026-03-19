const { Invoice, Client, User, Payment, Product } = require('../models');
const sequelize = require('../config/database');
const { Op } = require('sequelize');

const generateInvoiceNumber = async () => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const count = await Invoice.count() + 1;
  return `FACT-${year}${month}${day}-${count.toString().padStart(4, '0')}`;
};

exports.createInvoice = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { clientId, items } = req.body;
    const client = await Client.findByPk(clientId);
    if (!client) {
      return res.status(404).json({ message: 'Client non trouvé' });
    }

    let subtotal = 0;
    let taxTotal = 0;
    const invoiceItems = [];

    for (const item of items) {
      const product = await Product.findByPk(item.productId);
      if (!product) {
        await t.rollback();
        return res.status(404).json({ message: `Produit ${item.productId} non trouvé` });
      }
      const unitPrice = parseFloat(product.price);
      const taxRate = parseFloat(product.taxRate);
      const quantity = item.quantity;
      const itemSubtotal = unitPrice * quantity;
      const itemTax = itemSubtotal * taxRate / 100;
      const itemTotal = itemSubtotal + itemTax;

      subtotal += itemSubtotal;
      taxTotal += itemTax;

      invoiceItems.push({
        productId: product.id,
        description: product.name,
        quantity,
        unitPrice,
        taxRate,
        subtotal: itemSubtotal,
        taxAmount: itemTax,
        total: itemTotal
      });
    }

    const total = subtotal + taxTotal;
    const invoiceNumber = await generateInvoiceNumber();

    const invoice = await Invoice.create({
      number: invoiceNumber,
      clientId,
      items: invoiceItems,
      subtotal,
      taxTotal,
      total,
      status: 'draft',
      createdBy: req.user.id
    }, { transaction: t });

    await t.commit();
    res.status(201).json(invoice);
  } catch (error) {
    await t.rollback();
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

exports.getInvoices = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status = '', sort = 'createdAt', order = 'DESC' } = req.query;
    const offset = (page - 1) * limit;

    const whereInvoice = {};
    if (status) {
      whereInvoice.status = status;
    }

    const searchCondition = search ? {
      [Op.or]: [
        { number: { [Op.like]: `%${search}%` } },
        { '$client.name$': { [Op.like]: `%${search}%` } }
      ]
    } : {};

    const { count, rows } = await Invoice.findAndCountAll({
      where: {
        ...whereInvoice,
        ...searchCondition
      },
      include: [
        { model: Client, as: 'client', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'createdByUser', attributes: ['id', 'name'] },
        { model: Payment, include: [{ model: User, as: 'receiver', attributes: ['id', 'name'] }] }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sort, order]],
      distinct: true,
      subQuery: false
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

exports.getAllInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.findAll({
      include: [
        { model: Client, as: 'client', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'createdByUser', attributes: ['id', 'name'] },
        { model: Payment, include: [{ model: User, as: 'receiver', attributes: ['id', 'name'] }] }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json(invoices);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

exports.getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findByPk(req.params.id, {
      include: [
        { model: Client, as: 'client', attributes: ['id', 'name', 'email', 'phone', 'address'] },
        { model: User, as: 'createdByUser', attributes: ['id', 'name'] },
        { model: Payment, include: [{ model: User, as: 'receiver', attributes: ['id', 'name'] }] }
      ]
    });
    if (!invoice) {
      return res.status(404).json({ message: 'Facture non trouvée' });
    }
    res.json(invoice);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

exports.updateInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findByPk(req.params.id);
    if (!invoice) {
      return res.status(404).json({ message: 'Facture non trouvée' });
    }
    if (invoice.status !== 'draft') {
      return res.status(400).json({ message: 'Impossible de modifier une facture payée ou annulée' });
    }
    res.json(invoice);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

exports.cancelInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findByPk(req.params.id);
    if (!invoice) {
      return res.status(404).json({ message: 'Facture non trouvée' });
    }
    if (invoice.status === 'paid') {
      return res.status(400).json({ message: 'Impossible d\'annuler une facture payée' });
    }
    invoice.status = 'cancelled';
    await invoice.save();
    res.json({ message: 'Facture annulée' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};