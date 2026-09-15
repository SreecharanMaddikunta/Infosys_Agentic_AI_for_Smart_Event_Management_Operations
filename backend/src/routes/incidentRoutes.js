const express = require('express');
const router = express.Router();
const { createIncident, getIncidents, updateIncidentStatus, deleteIncident } = require('../controllers/incidentController');
const { authMiddleware, adminMiddleware } = require('../middlewares/authMiddleware');

router.get('/', authMiddleware, adminMiddleware, getIncidents);
router.post('/', authMiddleware, createIncident);
router.put('/:id/status', authMiddleware, adminMiddleware, updateIncidentStatus);
router.delete('/:id', authMiddleware, adminMiddleware, deleteIncident);

module.exports = router;
