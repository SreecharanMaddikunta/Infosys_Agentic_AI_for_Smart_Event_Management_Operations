const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');

// All analytics routes
router.get('/', analyticsController.getAnalytics);
router.get('/intelligence', analyticsController.getIntelligenceData);
router.put('/recommendations/:id', analyticsController.updateRecommendationStatus);
router.post('/trigger-mock', analyticsController.triggerMockIntelligence);

module.exports = router;
