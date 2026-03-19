const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  enable2FA,
  disable2FA
} = require('../controllers/userController');

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(protect);

// Routes pour les administrateurs uniquement
router.route('/')
  .get(authorize('admin'), getUsers)
  .post(authorize('admin'), createUser);

router.route('/:id')
  .get(authorize('admin'), getUserById)
  .put(authorize('admin'), updateUser)
  .delete(authorize('admin'), deleteUser);

// Routes pour la gestion 2FA
router.post('/:id/enable-2fa', authorize('admin'), enable2FA);
router.post('/:id/disable-2fa', authorize('admin'), disable2FA);

module.exports = router;