const prisma = require('../utils/prisma');

const createEvent = async (req, res) => {
    try {
        const { title, description, date, venue, slots } = req.body;
        const event = await prisma.event.create({
            data: { title, description, date: new Date(date), venue, slots: parseInt(slots) }
        });
        const io = req.app.get('io');
        if (io) io.emit('event_created', event);
        res.status(201).json(event);
    } catch (error) {
        res.status(500).json({ error: 'Server error', details: error.message });
    }
};

const getEvents = async (req, res) => {
    try {
        const events = await prisma.event.findMany({
            orderBy: { date: 'asc' },
            include: {
                registrations: {
                    include: { student: true }
                },
                sessions: {
                    include: { speaker: true, venue: true }
                },
                sponsors: true
            }
        });

        const eventsWithStats = events.map(event => {
            const categoryStats = {};
            const genderStats = {};
            let approvedCount = 0;

            event.registrations.forEach(reg => {
                if (reg.status === 'APPROVED' || reg.status === 'COMPLETED') {
                    approvedCount++;
                }
                
                if (reg.student) {
                    const cat = reg.student.category || 'Student';
                    const gen = reg.student.gender || 'Unknown';
                    categoryStats[cat] = (categoryStats[cat] || 0) + 1;
                    genderStats[gen] = (genderStats[gen] || 0) + 1;
                }
            });

            // Remove the raw registrations array to save payload size
            const { registrations, ...eventData } = event;

            return {
                ...eventData,
                totalRegistrations: event.registrations.length,
                approvedRegistrations: approvedCount,
                categoryStats,
                genderStats,
                sessions: event.sessions,
                sponsors: event.sponsors
            };
        });

        res.json(eventsWithStats);
    } catch (error) {
        console.error("Error in getEvents:", error);
        res.status(500).json({ error: 'Server error' });
    }
};

const updateEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, date, venue, slots } = req.body;
        const event = await prisma.event.update({
            where: { id: parseInt(id) },
            data: { title, description, date: new Date(date), venue, slots: parseInt(slots) }
        });
        const io = req.app.get('io');
        if (io) io.emit('event_updated', event);
        res.json(event);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update event', details: error.message });
    }
};

const deleteEvent = async (req, res) => {
    try {
        const { id } = req.params;
        // First delete associated registrations and attendances to prevent foreign key constraint failures
        await prisma.attendance.deleteMany({ where: { eventId: parseInt(id) } });
        await prisma.registration.deleteMany({ where: { eventId: parseInt(id) } });
        await prisma.event.delete({ where: { id: parseInt(id) } });
        const io = req.app.get('io');
        if (io) io.emit('event_deleted', { id: parseInt(id) });
        res.json({ message: 'Event deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete event', details: error.message });
    }
};

module.exports = { createEvent, getEvents, updateEvent, deleteEvent };
