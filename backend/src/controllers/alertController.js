const prisma = require('../utils/prisma');

const getAlerts = async (req, res) => {
  try {
    const alerts = await prisma.alert.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50
    });
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch alerts', details: error.message });
  }
};

const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const alert = await prisma.alert.update({
      where: { id: parseInt(id) },
      data: { isRead: true }
    });
    res.json(alert);
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark alert as read', details: error.message });
  }
};

const createAlert = async (type, message, source, io) => {
    try {
        const alert = await prisma.alert.create({
            data: {
                type,
                message,
                source
            }
        });
        if (io) {
            io.emit('new_alert', alert);
        }
        return alert;
    } catch (error) {
        console.error('Failed to create alert:', error);
    }
};

const createAlertRoute = async (req, res) => {
    try {
        const { type, message, source } = req.body;
        const io = req.app.get('io');
        const alert = await createAlert(type, message, source, io);
        res.status(201).json(alert);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create alert via route' });
    }
};

module.exports = {
  getAlerts,
  markAsRead,
  createAlert,
  createAlertRoute
};
