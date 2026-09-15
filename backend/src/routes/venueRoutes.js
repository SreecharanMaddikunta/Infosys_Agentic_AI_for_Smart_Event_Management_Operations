const express = require('express');
const router = express.Router();
const venueController = require('../controllers/venueController');

router.get('/', venueController.getAllVenues);
router.post('/', venueController.createVenue);
router.put('/:id/status', venueController.updateVenueStatus);
router.post('/suggest', venueController.suggestBestVenues);

// Locking routes
router.post('/:id/lock', venueController.lockVenue);
router.post('/:id/unlock', venueController.unlockVenue);

module.exports = router;
