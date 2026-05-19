const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  getLowStockProducts,
  getStockStats,
  updateMinStock,
  getAllProductsStock,
  updateStock
} = require('../controllers/stockAlertController');

const router = express.Router();

router.use(protect);

router.get('/low', getLowStockProducts);
router.get('/stats', getStockStats);
router.get('/all', getAllProductsStock);
router.put('/:id/min-stock', authorize('admin'), updateMinStock);
router.put('/:id/stock', authorize('admin'), updateStock);

module.exports = router;