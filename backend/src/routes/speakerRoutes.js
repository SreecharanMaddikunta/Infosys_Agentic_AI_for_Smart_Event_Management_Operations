const express = require('express');
const router = express.Router();
const speakerController = require('../controllers/speakerController');

router.get('/', speakerController.getAllSpeakers);
router.post('/', speakerController.createSpeaker);
router.post('/suggest', speakerController.suggestBestSpeakers);

// Locking routes
router.post('/:id/lock', speakerController.lockSpeaker);
router.post('/:id/unlock', speakerController.unlockSpeaker);

module.exports = router;
