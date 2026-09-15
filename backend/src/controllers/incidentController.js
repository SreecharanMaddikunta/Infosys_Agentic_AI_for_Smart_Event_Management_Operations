const prisma = require('../utils/prisma');
const { createAlert } = require('./alertController');

const createIncident = async (req, res) => {
  try {
    const { description, category, severity, priority, affectedArea, responsibleTeam, recommendedAction, photoBase64, incidentType, incidentTime, eventId } = req.body;
    
    // Parse time and eventId properly if provided
    const parsedTime = incidentTime ? new Date(incidentTime) : undefined;
    const parsedEventId = eventId ? parseInt(eventId) : undefined;
    console.log("Creating incident with payload:", req.body, "parsedTime:", parsedTime, "parsedEventId:", parsedEventId);

    const incident = await prisma.incident.create({
      data: {
        description,
        category,
        severity,
        priority,
        affectedArea,
        responsibleTeam,
        recommendedAction,
        photoBase64,
        incidentType,
        incidentTime: parsedTime,
        eventId: parsedEventId,
        status: 'Logged',
      }
    });

    const io = req.app.get('io');
    
    // Handle Alerts based on severity
    if (severity === 'Critical') {
      await createAlert('CRITICAL', `New Critical Incident Logged: ${description}`, 'SYSTEM', io);
    } else if (priority === 'High') {
      await createAlert('HIGH', `New High Priority Incident Logged: ${description}`, 'SYSTEM', io);
    } else {
      await createAlert('MEDIUM', `New Incident Logged: ${description}`, 'SYSTEM', io);
    }

    if (io) {
        io.emit('incident_created', incident);
    }

    res.status(201).json(incident);
  } catch (error) {
    console.error("Error creating incident:", error);
    res.status(500).json({ error: 'Failed to create incident', details: error.message });
  }
};

const getIncidents = async (req, res) => {
  try {
    const incidents = await prisma.incident.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(incidents);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch incidents' });
  }
};

const updateIncidentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, resolutionNotes } = req.body;
    
    const updated = await prisma.incident.update({
      where: { id: parseInt(id) },
      data: { status, resolutionNotes }
    });

    const io = req.app.get('io');
    
    if (status === 'Resolved' || status === 'Closed') {
      await createAlert('INFO', `Incident ${id} has been marked as ${status}`, 'SYSTEM', io);
    }

    if (io) {
        io.emit('incident_updated', updated);
    }

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update incident status' });
  }
};

const deleteIncident = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Optional: check status first to ensure it's Closed
    const incident = await prisma.incident.findUnique({ where: { id: parseInt(id) } });
    if (!incident) {
      return res.status(404).json({ error: 'Incident not found' });
    }
    if (incident.status !== 'Closed') {
      return res.status(400).json({ error: 'Only closed incidents can be deleted' });
    }

    await prisma.incident.delete({
      where: { id: parseInt(id) }
    });

    const io = req.app.get('io');
    if (io) {
        io.emit('incident_deleted', { id: parseInt(id) });
    }

    res.json({ message: 'Incident deleted successfully' });
  } catch (error) {
    console.error("Error deleting incident:", error);
    res.status(500).json({ error: 'Failed to delete incident' });
  }
};

module.exports = {
  createIncident,
  getIncidents,
  updateIncidentStatus,
  deleteIncident
};
