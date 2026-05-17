const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  getConfigs,
  updateConfig,
  getStats
} = require('../controllers/rateLimitController');

const router = express.Router();

// Toutes les routes nécessitent une authentification admin
router.use(protect);
router.use(authorize('admin'));

router.get('/', getConfigs);
router.get('/stats', getStats);
router.put('/:id', updateConfig);

module.exports = router;