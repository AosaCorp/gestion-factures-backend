const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  getSalesReport,
  getTopProducts,
  getClientsReport,
  getPaymentsReport
} = require('../controllers/reportController');

const router = express.Router();

router.use(protect);

router.get('/sales', authorize('admin', 'manager'), getSalesReport);
router.get('/top-products', authorize('admin', 'manager'), getTopProducts);
router.get('/clients', authorize('admin', 'manager'), getClientsReport);
router.get('/payments', authorize('admin', 'manager'), getPaymentsReport);

module.exports = router;