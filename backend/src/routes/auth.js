const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  register,
  login,
  verifyTwoFactor,
  enableTwoFactor,
  changePassword,
  getMe
} = require('../controllers/authController');

const router = express.Router();

router.post('/register', protect, authorize('admin'), register);
router.post('/login', login);
router.post('/verify-2fa', verifyTwoFactor);
router.post('/enable-2fa', protect, enableTwoFactor);
router.post('/change-password', protect, changePassword);
router.get('/me', protect, getMe);

module.exports = router;