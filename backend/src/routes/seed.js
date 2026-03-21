const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { seedAdmin } = require('../controllers/seedController');

const router = express.Router();

router.use(protect);
router.post('/admin', authorize('admin'), seedAdmin);

module.exports = router;