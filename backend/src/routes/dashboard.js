const express = require('express');
const { protect } = require('../middleware/auth');
const {
  getConfig,
  updateConfig,
  resetConfig,
  getAvailableWidgets
} = require('../controllers/dashboardController');

const router = express.Router();

router.use(protect);

router.get('/config', getConfig);
router.put('/config', updateConfig);
router.post('/config/reset', resetConfig);
router.get('/widgets', getAvailableWidgets);

module.exports = router;