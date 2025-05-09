const express = require('express');
const router = express.Router();
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');
const activityLogController = require('../controllers/activityLogController');

// Internal service activity logging - no auth required
router.post('/admin/activities/service-log', activityLogController.logActivity);

// Protected routes - require admin access
router.use(verifyToken, requireAdmin);

// Admin routes
router.get('/admin/activities/user/:userId', activityLogController.getUserActivities);
router.get('/admin/activities', activityLogController.getAllActivities);
router.get('/admin/activities/stats', activityLogController.getActivityStats);

module.exports = router; 