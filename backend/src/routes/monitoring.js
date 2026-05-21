const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const monitoringService = require('../services/monitoringService');

const router = express.Router();

router.use(protect);
router.use(authorize('admin'));

router.get('/metrics', async (req, res) => {
  try {
    const metrics = await monitoringService.getAllMetrics();
    res.json(metrics);
  } catch (error) {
    console.error('Erreur métriques:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/requests', (req, res) => {
  try {
    const stats = monitoringService.getRequestStats();
    res.json(stats);
  } catch (error) {
    console.error('Erreur stats requêtes:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

module.exports = router;