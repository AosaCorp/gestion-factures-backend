const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  getAllReminders,
  getRemindersByInvoice,
  runReminderCheck,
  runReminderSend,
  getReminderStats,
  deleteReminder
} = require('../controllers/reminderController');

const router = express.Router();

router.use(protect);
router.use(authorize('admin', 'manager'));

router.get('/', getAllReminders);
router.get('/stats', getReminderStats);
router.get('/invoice/:invoiceId', getRemindersByInvoice);
router.post('/check', runReminderCheck);
router.post('/send', runReminderSend);
router.delete('/:id', deleteReminder);

module.exports = router;