const express = require('express');
const router = express.Router();
const vishwakarmaLogsController = require('../controllers/vishwakarmaLogsController');

/**
 * Vishwakarma API Logs Routes
 * Base path: /api/vishwakarma/logs
 * 
 * Unified RESTful API for fetching stats and triggering syncs.
 */

// --- RESTful Stats API (Unified Endpoint) ---

// GET /stats - Fetch comprehensive stats (Call Stats style)
router.get('/stats', vishwakarmaLogsController.getComprehensiveReport);

// POST /stats - Trigger sync and get result stats
router.post('/stats', vishwakarmaLogsController.triggerManualSync);

// POST /push-stats - Manually trigger call stats push to Vishwakarma
router.post('/push-stats', vishwakarmaLogsController.triggerManualPushStats);

module.exports = router;
