const prisma = require('../utils/prisma');
const axios = require('axios');

// In-memory lock store for venues
// Key: venueId (string), Value: { lockedBy: string, lockedAt: number, timeoutId: timeout }
const venueLocks = new Map();
const LOCK_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

// Get all venues
exports.getAllVenues = async (req, res) => {
    try {
        const venues = await prisma.venue.findMany({
            include: {
                sessions: {
                    include: {
                        event: true
                    }
                }
            }
        });
        res.json(venues);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Create a new venue
exports.createVenue = async (req, res) => {
    try {
        const { name, capacity, location, facilities, status } = req.body;
        const venue = await prisma.venue.create({
            data: {
                name,
                capacity: parseInt(capacity),
                location,
                facilities: JSON.stringify(facilities),
                status
            }
        });
        res.status(201).json(venue);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update venue status
exports.updateVenueStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const venue = await prisma.venue.update({
            where: { id: parseInt(id) },
            data: { status }
        });
        const io = req.app.get('io');
        io.emit('VENUE_UPDATED', venue);
        res.json(venue);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Ask AI for best venues
exports.suggestBestVenues = async (req, res) => {
    try {
        const { eventRequirements } = req.body;
        const capacity = parseInt(eventRequirements.capacity) || 0;
        // 1. Fetch available venues. Allow AI to sort all of them to find closest matches
        const venues = await prisma.venue.findMany({
            where: {
                status: 'AVAILABLE'
            }
        });

        // 2. Fetch existing sessions to check for conflicts (simplified logic, usually pass dates)
        // Pass data to Python AI service
        try {
            const aiResponse = await axios.post('http://127.0.0.1:8000/ai/venue/suggest', {
                requirements: eventRequirements,
                venues: venues
            }, { timeout: 5000 });

            if (aiResponse.data.error || !Array.isArray(aiResponse.data) || aiResponse.data.length === 0) {
                throw new Error(aiResponse.data.error || "Invalid or empty AI response");
            }

            // Return only the top 10 priority venues
            return res.json(aiResponse.data.slice(0, 10));
        } catch (aiError) {
            console.error("AI Service offline or error. Using Node.js fallback:", aiError.message);
            const req_cap = capacity;
            
            const fallback = venues.map(v => {
                let score = 50;
                const v_cap = parseInt(v.capacity) || 0;
                if (req_cap === 0) {
                    score = 50;
                } else if (v_cap === req_cap) {
                    score = 100;
                } else if (v_cap > req_cap) {
                    score = Math.max(50, 100 - Math.floor((v_cap - req_cap) / 5));
                } else {
                    score = Math.max(0, 50 - Math.floor((req_cap - v_cap) / 5));
                }
                
                return {
                    venue: v,
                    priority_score: score,
                    reasoning: `Node Fallback: Heuristic priority (Capacity: ${v_cap} vs Required: ${req_cap}).`
                };
            });
            
            fallback.sort((a, b) => b.priority_score - a.priority_score);
            return res.json(fallback.slice(0, 10));
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Lock Venue (Now just creates a booking session)
exports.lockVenue = async (req, res) => {
    const { id } = req.params;
    const { eventId, startTime, endTime } = req.body; 

    try {
        if (eventId && startTime && endTime) {
            const start = new Date(startTime);
            const end = new Date(endTime);
            
            // Check for time conflict
            const overlappingSession = await prisma.session.findFirst({
                where: {
                    venueId: parseInt(id),
                    startTime: { lt: end },
                    endTime: { gt: start }
                }
            });
            
            if (overlappingSession) {
                return res.status(409).json({ error: 'Venue is already booked for another session during this time.' });
            }

            const session = await prisma.session.create({
                data: {
                    eventId: parseInt(eventId),
                    venueId: parseInt(id),
                    title: 'Venue Booking',
                    startTime: start,
                    endTime: end
                }
            });
            
            const io = req.app.get('io');
            if (io) {
                io.emit('SESSION_SCHEDULED', session);
                io.emit('VENUE_BOOKED', { venueId: id, session });
            }
        }
        res.json({ success: true, message: 'Venue booked successfully.' });
    } catch (dbError) {
        return res.status(500).json({ error: 'Failed to create venue session in database.', details: dbError.message });
    }
};

// Unlock Venue (Deprecated, now use DELETE /api/sessions/:id)
exports.unlockVenue = async (req, res) => {
    res.json({ success: true, message: 'Deprecated: use DELETE /api/sessions/:id instead' });
};
