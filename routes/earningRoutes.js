const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const earningController = require('../controllers/earningController');

const router = express.Router();

// ── Public ──────────────────────────────────────────────────────────────────
// GET /api/earnings/config — returns current platform fee rate (public)
router.get('/config', earningController.getPlatformConfig);

// ── One-time setup (secured by PLATFORM_SETUP_SECRET) ───────────────────────
// POST /api/earnings/set-platform-owner
// Body: { user_id, setup_secret }
router.post('/set-platform-owner', earningController.setPlatformOwner);

// ── Authenticated ────────────────────────────────────────────────────────────
// GET  /api/earnings/wallet    — any user's wallet balance
router.get('/wallet', authMiddleware, earningController.getWalletBalance);

// GET  /api/earnings/my        — provider: own earnings history + stats
router.get('/my', authMiddleware, earningController.getMyEarnings);

// GET  /api/earnings/platform  — platform_owner only: full commission dashboard
router.get('/platform', authMiddleware, earningController.getPlatformEarnings);

// PUT  /api/earnings/config    — platform_owner only: update fee rate
router.put('/config', authMiddleware, earningController.updatePlatformConfig);

module.exports = router;
