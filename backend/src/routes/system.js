const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { getSystemInfo } = require('../controllers/systemController');

const router = express.Router();

router.use(protect);

router.get('/', authorize('admin'), getSystemInfo);

module.exports = router;