const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  subscribe,
  unsubscribe,
  testNotification,
  broadcast,
  getSubscriptions
} = require('../controllers/pushController');

const router = express.Router();

router.use(protect);

router.post('/subscribe', subscribe);
router.post('/unsubscribe', unsubscribe);
router.post('/test', testNotification);
router.get('/subscriptions', getSubscriptions);
router.post('/broadcast', authorize('admin'), broadcast);

module.exports = router;