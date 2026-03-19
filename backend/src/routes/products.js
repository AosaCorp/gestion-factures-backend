const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const logger = require('../middleware/logger');
const {
  getProducts,
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductStats
} = require('../controllers/productController');

const router = express.Router();

router.use(protect);

router.route('/')
  .get(authorize('cashier', 'admin', 'manager'), getProducts)
  .post(authorize('admin'), logger('CREATE_PRODUCT'), createProduct);

router.get('/all', authorize('cashier', 'admin', 'manager'), getAllProducts);
router.get('/stats', authorize('cashier', 'admin', 'manager'), getProductStats);

router.route('/:id')
  .get(authorize('cashier', 'admin', 'manager'), getProductById)
  .put(authorize('admin'), logger('UPDATE_PRODUCT'), updateProduct)
  .delete(authorize('admin'), logger('DELETE_PRODUCT'), deleteProduct);

module.exports = router;