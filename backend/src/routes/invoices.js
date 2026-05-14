const express = require('express');
const jwt = require('jsonwebtoken');
const { protect, authorize } = require('../middleware/auth');
const logger = require('../middleware/logger');
const invoiceController = require('../controllers/invoiceController');
const { generateInvoicePDF } = require('../utils/pdfGenerator');
const { Invoice, Client, Payment, User, Company } = require('../models');

const router = express.Router();

// ========== ROUTE PUBLIQUE (sans authentification) - pour QR Code ==========
router.get('/public/:id', async (req, res) => {
  try {
    const invoice = await Invoice.findByPk(req.params.id, {
      include: [
        { model: Client, as: 'client', attributes: ['id', 'name', 'email', 'phone', 'address'] },
        { model: Payment, include: [{ model: User, as: 'receiver', attributes: ['id', 'name'] }] }
      ]
    });
    
    if (!invoice) {
      return res.status(404).json({ message: 'Facture non trouvée' });
    }
    
    // Ne pas envoyer les informations sensibles (seulement ce qui est nécessaire)
    res.json({
      id: invoice.id,
      number: invoice.number,
      createdAt: invoice.createdAt,
      subtotal: invoice.subtotal,
      taxTotal: invoice.taxTotal,
      total: invoice.total,
      status: invoice.status,
      client: invoice.client ? {
        name: invoice.client.name,
        address: invoice.client.address
      } : null,
      items: invoice.items || [],
      payments: invoice.Payments || []
    });
  } catch (error) {
    console.error('Erreur consultation publique:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});
// =========================================================================

router.use(protect);

// Routes
router.route('/')
  .get(authorize('cashier', 'admin', 'manager'), invoiceController.getInvoices)
  .post(authorize('cashier', 'admin'), logger('CREATE_INVOICE'), invoiceController.createInvoice);

router.get('/all', authorize('cashier', 'admin', 'manager'), invoiceController.getAllInvoices);

router.route('/:id')
  .get(authorize('cashier', 'admin', 'manager'), invoiceController.getInvoiceById)
  .put(authorize('cashier', 'admin'), logger('UPDATE_INVOICE'), invoiceController.updateInvoice)
  .delete(authorize('admin'), logger('CANCEL_INVOICE'), invoiceController.cancelInvoice);

// Envoi de la facture par email
router.post('/:id/send-email', authorize('cashier', 'admin'), logger('SEND_INVOICE_EMAIL'), invoiceController.sendInvoiceEmail);

// Route PDF avec token dans l'URL (pour l'application mobile)
router.get('/:id/pdf', async (req, res) => {
  let token = req.headers.authorization?.split(' ')[1];
  if (!token && req.query.token) token = req.query.token;
  if (!token) {
    return res.status(401).json({ message: 'Non autorisé, token manquant' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'Utilisateur non trouvé' });
    }

    const invoice = await Invoice.findByPk(req.params.id, {
      include: [
        { model: Client, as: 'client' },
        { model: Payment, include: [{ model: User, as: 'receiver' }] }
      ]
    });
    if (!invoice) {
      return res.status(404).json({ message: 'Facture non trouvée' });
    }

    const company = await Company.findOne();
    const items = invoice.items || [];
    const pdfBuffer = await generateInvoicePDF(invoice, invoice.client, items, invoice.Payments, company);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=facture-${invoice.number}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Erreur génération PDF:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;