const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { getStats } = require('../controllers/statsController');

const router = express.Router();

router.use(protect);
router.get('/', authorize('admin', 'manager', 'cashier'), getStats); // accessible à tous les rôles connectés

module.exports = router;