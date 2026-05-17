const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  getWebhooks,
  getWebhookById,
  createWebhook,
  updateWebhook,
  deleteWebhook,
  testWebhook,
  getAvailableEvents
} = require('../controllers/webhookController');
const webhookTrigger = require('../middleware/webhookTrigger');

const router = express.Router();

router.use(protect);
router.use(authorize('admin'));

router.get('/', getWebhooks);
router.get('/events', getAvailableEvents);
router.get('/:id', getWebhookById);
router.post('/', createWebhook);
router.put('/:id', updateWebhook);
router.delete('/:id', deleteWebhook);
router.post('/:id/test', testWebhook);
router.post('/',
  authorize('cashier', 'admin'),
  logger('CREATE_INVOICE'),
  webhookTrigger('invoice.created', (req, data) => data),
  invoiceController.createInvoice
);


module.exports = router;