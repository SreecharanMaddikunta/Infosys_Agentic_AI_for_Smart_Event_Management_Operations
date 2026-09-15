const express = require('express');
const router = express.Router();
const { getAlerts, markAsRead, createAlertRoute } = require('../controllers/alertController');
const { authMiddleware, adminMiddleware } = require('../middlewares/authMiddleware');

router.get('/', authMiddleware, adminMiddleware, getAlerts);
router.put('/:id/read', authMiddleware, adminMiddleware, markAsRead);
router.post('/', createAlertRoute);

module.exports = router;
