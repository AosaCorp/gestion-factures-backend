const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { 
  getStats,
  getMonthlyStats,
  getTopClients,
  getSalesForecast,
  getConversionRate,
  getGrowthStats,
  exportStatsPDF
} = require('../controllers/statsController');

const router = express.Router();

router.use(protect);

// Routes existantes
router.get('/', authorize('admin', 'manager', 'cashier'), getStats);

// Nouvelles routes pour statistiques avancées
router.get('/monthly', authorize('admin', 'manager'), getMonthlyStats);
router.get('/top-clients', authorize('admin', 'manager'), getTopClients);
router.get('/forecast', authorize('admin', 'manager'), getSalesForecast);
router.get('/conversion', authorize('admin', 'manager'), getConversionRate);
router.get('/growth', authorize('admin', 'manager'), getGrowthStats);
router.get('/export-pdf', authorize('admin', 'manager'), exportStatsPDF);

module.exports = router;