const { Client, Product, Invoice, Payment, ApiKey, User, sequelize } = require('../models');
const { Op } = require('sequelize');
const crypto = require('crypto');

/**
 * Gestion des clés API
 */

// Récupérer toutes les clés API de l'utilisateur
exports.getApiKeys = async (req, res) => {
  try {
    const apiKeys = await ApiKey.findAll({
      where: { userId: req.user.id },
      attributes: { exclude: ['key'] } // Ne pas renvoyer la clé complète
    });
    res.json(apiKeys);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Créer une nouvelle clé API
exports.createApiKey = async (req, res) => {
  try {
    const { name, permissions, expiresInDays } = req.body;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Le nom de la clé est requis' });
    }
    
    const expiresAt = expiresInDays && expiresInDays > 0 
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000) 
      : null;
    
    // Générer la clé API
    const generatedKey = `pk_live_${crypto.randomBytes(32).toString('hex')}`;
    
    const apiKey = await ApiKey.create({
      name: name.trim(),
      key: generatedKey,
      userId: req.user.id,
      permissions: permissions || {
        invoices: { read: true, write: true },
        clients: { read: true, write: true },
        products: { read: true, write: true },
        payments: { read: true, write: false },
        reports: { read: true, write: false }
      },
      expiresAt
    });
    
    res.status(201).json({
      id: apiKey.id,
      name: apiKey.name,
      key: apiKey.key,
      permissions: apiKey.permissions,
      expiresAt: apiKey.expiresAt,
      createdAt: apiKey.createdAt
    });
  } catch (error) {
    console.error('Erreur création clé API:', error);
    if (error.name === 'SequelizeValidationError') {
      res.status(400).json({ error: error.errors[0].message });
    } else {
      res.status(500).json({ error: 'Erreur serveur lors de la création de la clé' });
    }
  }
};

// Révoquer une clé API
exports.revokeApiKey = async (req, res) => {
  try {
    const apiKey = await ApiKey.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });
    
    if (!apiKey) {
      return res.status(404).json({ error: 'Clé API non trouvée' });
    }
    
    await apiKey.update({ status: 'disabled' });
    res.json({ message: 'Clé API révoquée avec succès' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Supprimer une clé API
exports.deleteApiKey = async (req, res) => {
  try {
    const apiKey = await ApiKey.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });
    
    if (!apiKey) {
      return res.status(404).json({ error: 'Clé API non trouvée' });
    }
    
    await apiKey.destroy();
    res.json({ message: 'Clé API supprimée' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Endpoints publics (avec clé API)
 */

// Récupérer tous les clients
exports.getClients = async (req, res) => {
  try {
    const clients = await Client.findAll({
      attributes: ['id', 'name', 'email', 'phone', 'address', 'createdAt'],
      order: [['createdAt', 'DESC']]
    });
    res.json({ success: true, data: clients, total: clients.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Récupérer un client spécifique
exports.getClientById = async (req, res) => {
  try {
    const client = await Client.findByPk(req.params.id, {
      attributes: ['id', 'name', 'email', 'phone', 'address', 'createdAt']
    });
    if (!client) {
      return res.status(404).json({ error: 'Client non trouvé' });
    }
    res.json({ success: true, data: client });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Récupérer tous les produits
exports.getProducts = async (req, res) => {
  try {
    const products = await Product.findAll({
      attributes: ['id', 'name', 'category', 'description', 'price', 'taxRate', 'type', 'stock', 'createdAt'],
      order: [['createdAt', 'DESC']]
    });
    res.json({ success: true, data: products, total: products.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Récupérer un produit spécifique
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Produit non trouvé' });
    }
    res.json({ success: true, data: product });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Récupérer toutes les factures
exports.getInvoices = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const offset = (page - 1) * limit;
    
    const where = {};
    if (status) where.status = status;
    
    const { count, rows } = await Invoice.findAndCountAll({
      where,
      include: [
        { model: Client, as: 'client', attributes: ['id', 'name'] }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });
    
    res.json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Récupérer une facture spécifique
exports.getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findByPk(req.params.id, {
      include: [
        { model: Client, as: 'client', attributes: ['id', 'name', 'email', 'phone', 'address'] },
        { model: Payment, as: 'Payments', attributes: ['id', 'amount', 'method', 'createdAt'] }
      ]
    });
    if (!invoice) {
      return res.status(404).json({ error: 'Facture non trouvée' });
    }
    res.json({ success: true, data: invoice });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Créer une facture
exports.createInvoice = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { clientId, items } = req.body;
    
    const client = await Client.findByPk(clientId);
    if (!client) {
      return res.status(404).json({ error: 'Client non trouvé' });
    }
    
    let subtotal = 0;
    let taxTotal = 0;
    const invoiceItems = [];
    
    for (const item of items) {
      const product = await Product.findByPk(item.productId);
      if (!product) {
        await t.rollback();
        return res.status(404).json({ error: `Produit ${item.productId} non trouvé` });
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
        productName: product.name,
        productDescription: product.category || product.description || '',
        quantity,
        unitPrice,
        taxRate,
        subtotal: itemSubtotal,
        taxAmount: itemTax,
        total: itemTotal
      });
    }
    
    const total = subtotal + taxTotal;
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const count = await Invoice.count() + 1;
    const invoiceNumber = `FACT-${year}${month}${day}-${count.toString().padStart(4, '0')}`;
    
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
    res.status(201).json({ success: true, data: invoice });
  } catch (error) {
    await t.rollback();
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Récupérer les statistiques
exports.getStats = async (req, res) => {
  try {
    const clientsCount = await Client.count();
    const productsCount = await Product.count();
    const invoicesCount = await Invoice.count();
    const paymentsCount = await Payment.count();
    
    const totalRevenue = await Invoice.sum('total', { where: { status: 'paid' } }) || 0;
    const totalPayments = await Payment.sum('amount') || 0;
    const totalUnpaid = totalRevenue - totalPayments;
    
    res.json({
      success: true,
      data: {
        clients: clientsCount,
        products: productsCount,
        invoices: invoicesCount,
        payments: paymentsCount,
        totalRevenue,
        totalPaid: totalPayments,
        totalUnpaid
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};