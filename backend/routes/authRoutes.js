const express = require('express');
const {
  signup,
  login,
  getMe,
  updateSettings,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const rateLimiter = require('../middleware/rateLimiter');

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/settings', protect, updateSettings);

router.post('/forgot-password', rateLimiter, forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/verify-email', protect, verifyEmail);
router.post('/resend-verification', protect, resendVerification);

module.exports = router;
