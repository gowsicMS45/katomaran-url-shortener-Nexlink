const express = require('express');
const { getDashboardStats, getUrlAnalytics, exportAnalytics, getWorkspaceAnalytics } = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/dashboard', protect, getDashboardStats);
router.get('/workspace', protect, getWorkspaceAnalytics);
router.get('/url/:id', protect, getUrlAnalytics);
router.get('/url/:id/export', protect, exportAnalytics);

module.exports = router;
