const express = require('express');
const { apiAuth, requirePermission } = require('../middleware/apiAuth');
const apiController = require('../controllers/apiController');

const router = express.Router();

// ========== Routes de gestion des clés API (authentification classique) ==========
// Ces routes nécessitent une authentification JWT standard
const { protect, authorize } = require('../middleware/auth');

router.use('/keys', protect);
router.get('/keys', authorize('admin'), apiController.getApiKeys);
router.post('/keys', authorize('admin'), apiController.createApiKey);
router.delete('/keys/:id', authorize('admin'), apiController.deleteApiKey);
router.post('/keys/:id/revoke', authorize('admin'), apiController.revokeApiKey);

// ========== Routes API publiques (authentification par clé API) ==========
router.use(apiAuth);

// Clients
router.get('/clients', requirePermission('clients', 'read'), apiController.getClients);
router.get('/clients/:id', requirePermission('clients', 'read'), apiController.getClientById);

// Produits
router.get('/products', requirePermission('products', 'read'), apiController.getProducts);
router.get('/products/:id', requirePermission('products', 'read'), apiController.getProductById);

// Factures
router.get('/invoices', requirePermission('invoices', 'read'), apiController.getInvoices);
router.get('/invoices/:id', requirePermission('invoices', 'read'), apiController.getInvoiceById);
router.post('/invoices', requirePermission('invoices', 'write'), apiController.createInvoice);

// Statistiques
router.get('/stats', requirePermission('reports', 'read'), apiController.getStats);

// Documentation
router.get('/', (req, res) => {
  res.json({
    name: 'API Gestion Factures',
    version: '1.0.0',
    endpoints: {
      clients: {
        list: 'GET /api/v1/clients',
        get: 'GET /api/v1/clients/:id'
      },
      products: {
        list: 'GET /api/v1/products',
        get: 'GET /api/v1/products/:id'
      },
      invoices: {
        list: 'GET /api/v1/invoices',
        get: 'GET /api/v1/invoices/:id',
        create: 'POST /api/v1/invoices'
      },
      stats: {
        get: 'GET /api/v1/stats'
      }
    },
    authentication: 'X-API-Key header required'
  });
});

module.exports = router;