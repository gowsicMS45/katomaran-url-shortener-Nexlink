const express = require('express');
const {
  createUrl,
  bulkCreateUrls,
  getUrls,
  searchUrls,
  getUrlById,
  updateUrl,
  deleteUrl,
  setPassword,
  verifyPassword,
  setClickLimit,
  toggleFavorite,
  getPublicStats,
  exportUrls,
} = require('../controllers/urlController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// ── Static routes (must come before /:id) ──────────────────────────────────
router.post('/bulk', protect, bulkCreateUrls);
router.get('/search', protect, searchUrls);
router.get('/export', protect, exportUrls);

// ── Core CRUD ───────────────────────────────────────────────────────────────
router.post('/', protect, createUrl);
router.get('/', protect, getUrls);
router.get('/:id', protect, getUrlById);
router.put('/:id', protect, updateUrl);
router.delete('/:id', protect, deleteUrl);

// ── Extended actions ────────────────────────────────────────────────────────
router.patch('/:id/password', protect, setPassword);
router.post('/:id/verify-password', verifyPassword);          // Public — no auth
router.patch('/:id/click-limit', protect, setClickLimit);
router.post('/:id/favorite', protect, toggleFavorite);
router.get('/:id/public-stats', getPublicStats);              // Public — no auth

module.exports = router;
