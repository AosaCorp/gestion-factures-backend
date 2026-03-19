const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const logger = require('../middleware/logger');
const {
  getPayments,
  createPayment,
  getPaymentsByInvoice
} = require('../controllers/paymentController');

const router = express.Router();

router.use(protect);

router.route('/')
  .get(authorize('admin', 'manager'), getPayments)  // ← nouvelle route
  .post(authorize('cashier', 'admin'), logger('CREATE_PAYMENT'), createPayment);

router.get('/invoice/:invoiceId', authorize('cashier', 'admin', 'manager'), getPaymentsByInvoice);

module.exports = router;