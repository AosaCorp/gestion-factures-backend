const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const logger = require('../middleware/logger');
const {
  getClients,
  getAllClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient
} = require('../controllers/clientController');

const router = express.Router();

router.use(protect);

router.route('/')
  .get(authorize('cashier', 'admin', 'manager'), getClients)
  .post(authorize('cashier', 'admin'), logger('CREATE_CLIENT'), createClient);

router.get('/all', authorize('cashier', 'admin', 'manager'), getAllClients);

router.route('/:id')
  .get(authorize('cashier', 'admin', 'manager'), getClientById)
  .put(authorize('cashier', 'admin'), logger('UPDATE_CLIENT'), updateClient)
  .delete(authorize('admin'), logger('DELETE_CLIENT'), deleteClient);

module.exports = router;