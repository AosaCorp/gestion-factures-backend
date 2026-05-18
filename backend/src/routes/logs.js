const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  getLogs,
  getLogStats,
  deleteLog,
  cleanLogs,
  exportLogsCSV,
  exportLogsJSON,
  exportLogsHTML
} = require('../controllers/logController');

const router = express.Router();

router.use(protect);
router.use(authorize('admin'));

router.get('/', getLogs);
router.get('/stats', getLogStats);
router.get('/export/csv', exportLogsCSV);
router.get('/export/json', exportLogsJSON);
router.get('/export/html', exportLogsHTML);
router.delete('/clean', cleanLogs);
router.delete('/:id', deleteLog);

module.exports = router;