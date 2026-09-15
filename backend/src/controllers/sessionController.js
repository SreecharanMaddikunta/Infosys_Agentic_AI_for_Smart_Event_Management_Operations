const prisma = require('../utils/prisma');

exports.getAllSessions = async (req, res) => {
    try {
        const sessions = await prisma.session.findMany({
            include: { event: true, speaker: true, venue: true }
        });
        res.json(sessions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createSession = async (req, res) => {
    try {
        const { eventId, title, description, startTime, endTime, speakerId, venueId } = req.body;
        
        // Basic conflict detection inside DB before booking
        const existingSession = await prisma.session.findFirst({
            where: {
                venueId: parseInt(venueId),
                startTime: { lt: new Date(endTime) },
                endTime: { gt: new Date(startTime) }
            }
        });

        if (existingSession) {
            return res.status(400).json({ error: 'Venue is already booked for this time slot.' });
        }

        const session = await prisma.session.create({
            data: {
                eventId: parseInt(eventId),
                title,
                description,
                startTime: new Date(startTime),
                endTime: new Date(endTime),
                speakerId: speakerId ? parseInt(speakerId) : null,
                venueId: venueId ? parseInt(venueId) : null
            },
            include: { venue: true, speaker: true }
        });

        // Broadcast to clients using Socket.io
        const io = req.app.get('io');
        io.emit('SESSION_SCHEDULED', session);
        if (venueId) {
            io.emit('VENUE_BOOKED', { venueId: session.venueId, session });
        }

        res.status(201).json(session);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteSession = async (req, res) => {
    try {
        const { id } = req.params;
        
        const session = await prisma.session.findUnique({ where: { id: parseInt(id) } });
        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }
        
        await prisma.session.delete({
            where: { id: parseInt(id) }
        });
        
        const io = req.app.get('io');
        io.emit('SESSION_DELETED', { sessionId: id });
        if (session.venueId) io.emit('VENUE_UPDATED', { id: session.venueId });
        if (session.speakerId) io.emit('SPEAKER_SCHEDULED');
        
        res.json({ success: true, message: 'Session deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
