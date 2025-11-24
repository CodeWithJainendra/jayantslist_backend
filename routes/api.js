const express = require('express');
const router = express.Router();
const artisanController = require('../controllers/artisanController');
const authController = require('../controllers/authController');


// GET /api/artisans - Fetch paginated artisans
router.get('/artisans', artisanController.getAllArtisans);

// POST /api/send-otp - Send OTP
router.post('/send-otp', authController.sendOtp);

// POST /api/validate-otp - Validate OTP
router.post('/validate-otp', authController.validateOtp);

// POST /api/refresh-token - Refresh Access Token
router.post('/refresh-token', authController.refreshToken);

// POST /api/sync - Manually trigger sync
router.post('/sync', artisanController.triggerSync);

// GET /api/categories - Fetch aggregated service categories
router.get('/categories', artisanController.getServiceCategories);

// POST /api/sync-dates - Manually trigger sync for Yesterday and Today
router.post('/sync-dates', artisanController.triggerSyncForDates);
router.get('/sync-dates', artisanController.triggerSyncForDates);

// --- Mobile App Routes ---
const mobileController = require('../controllers/mobileController');
const authenticateToken = require('../middleware/authMiddleware');

// 5. Update User Location
router.post('/user/location', authenticateToken, mobileController.updateUserLocation);

// 7. Nearby Sellers
router.get('/sellers/nearby', authenticateToken, mobileController.getNearbySellers);

// 9. Categories with Stats
router.get('/categories/stats', authenticateToken, mobileController.getCategories);

// 11. Search
router.get('/search', authenticateToken, mobileController.search);

// 13. Feeds
router.get('/feeds', authenticateToken, mobileController.getFeeds);

// 15. Create Post
router.post('/sellers/posts', authenticateToken, mobileController.createPost);

module.exports = router;
