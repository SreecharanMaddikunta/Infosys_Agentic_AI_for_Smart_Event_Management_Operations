const express = require('express');
const router = express.Router();
const { getSponsors, createSponsor, updateSponsorMetrics, getMySponsorships, deleteSponsorship } = require('../controllers/sponsorController');
const { authMiddleware, adminMiddleware } = require('../middlewares/authMiddleware');

router.get('/me', authMiddleware, getMySponsorships);
router.get('/', authMiddleware, adminMiddleware, getSponsors);
router.post('/', authMiddleware, createSponsor);
router.put('/:id/metrics', authMiddleware, adminMiddleware, updateSponsorMetrics);
router.delete('/:id', authMiddleware, deleteSponsorship);

module.exports = router;
