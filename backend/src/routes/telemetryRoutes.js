const express = require('express');
const router = express.Router();
const { ingestTelemetry } = require('../controllers/telemetryController');
const { authMiddleware, adminMiddleware } = require('../middlewares/authMiddleware');

router.post('/', authMiddleware, adminMiddleware, ingestTelemetry);

module.exports = router;
