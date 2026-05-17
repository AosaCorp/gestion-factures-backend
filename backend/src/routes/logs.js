const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  getLogs,
  getLogStats,
  deleteLog,
  cleanLogs
} = require('../controllers/logController');

const router = express.Router();

// Toutes les routes nécessitent une authentification et le rôle admin
router.use(protect);
router.use(authorize('admin'));

router.get('/', getLogs);
router.get('/stats', getLogStats);
router.delete('/clean', cleanLogs);
router.delete('/:id', deleteLog);

module.exports = router;