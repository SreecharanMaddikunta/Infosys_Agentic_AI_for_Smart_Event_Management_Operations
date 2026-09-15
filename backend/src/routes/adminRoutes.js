const express = require('express');
const router = express.Router();
const { getAdminStats, getRegistrations, getEventAttendees, overrideRegistration } = require('../controllers/adminController');
const { scanTicket } = require('../controllers/scanController');
const { authMiddleware } = require('../middlewares/authMiddleware');

router.get('/stats', authMiddleware, getAdminStats);
router.post('/scan', authMiddleware, scanTicket);
router.get('/registrations', authMiddleware, getRegistrations);
router.get('/events/:id/attendees', authMiddleware, getEventAttendees);
router.post('/registrations/:id/override', authMiddleware, overrideRegistration);

module.exports = router;
