const express = require('express');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Toutes les routes nécessitent une authentification admin
router.use(protect);
router.use(authorize('admin'));

// Route simple pour les stats
router.get('/', (req, res) => {
  res.json({
    active: true,
    limits: [
      { name: 'API Générale', window: '15 minutes', max: 100 },
      { name: 'Authentification', window: '15 minutes', max: 5 },
      { name: 'API Publique', window: '1 minute', max: 30 },
      { name: 'Webhooks', window: '1 heure', max: 100 }
    ]
  });
});

router.get('/stats', (req, res) => {
  res.json({
    active: true,
    limits: [
      { name: 'API Générale', window: '15 minutes', max: 100 },
      { name: 'Authentification', window: '15 minutes', max: 5 },
      { name: 'API Publique', window: '1 minute', max: 30 },
      { name: 'Webhooks', window: '1 heure', max: 100 }
    ]
  });
});

module.exports = router;