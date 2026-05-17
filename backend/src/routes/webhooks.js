const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const logger = require('../middleware/logger');
const {
  getWebhooks,
  getWebhookById,
  createWebhook,
  updateWebhook,
  deleteWebhook,
  testWebhook,
  getAvailableEvents
} = require('../controllers/webhookController');

const router = express.Router();

// Toutes les routes nécessitent une authentification et le rôle admin
router.use(protect);
router.use(authorize('admin'));

router.get('/', getWebhooks);
router.get('/events', getAvailableEvents);
router.get('/:id', getWebhookById);
router.post('/', logger('CREATE_WEBHOOK'), createWebhook);
router.put('/:id', logger('UPDATE_WEBHOOK'), updateWebhook);
router.delete('/:id', logger('DELETE_WEBHOOK'), deleteWebhook);
router.post('/:id/test', logger('TEST_WEBHOOK'), testWebhook);

module.exports = router;