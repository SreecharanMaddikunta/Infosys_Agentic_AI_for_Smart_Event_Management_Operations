const prisma = require('../utils/prisma');

exports.getAnalytics = async (req, res) => {
    try {
        // 1. Overall Stats
        const totalEvents = await prisma.event.count();
        const totalUsers = await prisma.user.count({ where: { role: 'STUDENT' } });
        const totalRegistrations = await prisma.registration.count();
        const activeSessions = await prisma.session.count();

        // 2. Registration Trends over Time (Group by month or event date)
        const events = await prisma.event.findMany({
            orderBy: { date: 'asc' },
            include: { registrations: true }
        });

        const registrationTrends = events.map(e => ({
            name: e.title,
            registrations: e.registrations.length,
            capacity: e.slots,
            date: e.date
        }));

        // 3. Demographics (Category and Gender)
        const users = await prisma.user.findMany({ where: { role: 'STUDENT' } });
        const categoriesMap = {};
        const genderMap = {};
        
        users.forEach(u => {
            const cat = u.category || 'Student';
            const gen = u.gender || 'Prefer not to say';
            categoriesMap[cat] = (categoriesMap[cat] || 0) + 1;
            genderMap[gen] = (genderMap[gen] || 0) + 1;
        });

        const demographics = {
            categories: Object.keys(categoriesMap).map(name => ({ name, value: categoriesMap[name] })),
            genders: Object.keys(genderMap).map(name => ({ name, value: genderMap[name] }))
        };

        // 4. Venue Utilization
        const venues = await prisma.venue.findMany({
            include: { sessions: true }
        });

        const venueUtilization = venues.map(v => {
            // Rough utilization based on number of sessions booked vs available capacity
            return {
                name: v.name,
                sessionsCount: v.sessions.length,
                capacity: v.capacity,
                utilization: Math.min(v.sessions.length * 15, 100) // Mock percentage metric, roughly 15% per session for demo
            };
        });

        // 5. Speaker Popularity
        const speakers = await prisma.speaker.findMany({
            include: { sessions: true }
        });

        const speakerStats = speakers.map(s => ({
            name: s.name,
            sessions: s.sessions.length,
            rating: s.pastRating || 0
        }));

        // Fetch complete lists for the modal detail views
        const allRegistrations = await prisma.registration.findMany({ include: { student: true, event: true } });
        const allSessions = await prisma.session.findMany({ include: { event: true, speaker: true, venue: true } });

        res.json({
            overview: {
                totalEvents,
                totalUsers,
                totalRegistrations,
                activeSessions,
                eventsList: events,
                usersList: users,
                registrationsList: allRegistrations,
                sessionsList: allSessions
            },
            registrationTrends,
            demographics,
            venueUtilization,
            speakerStats
        });

    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch analytics', details: error.message });
    }
};

exports.getIntelligenceData = async (req, res) => {
    try {
        const insights = await prisma.eventInsight.findMany({
            orderBy: { createdAt: 'desc' },
            take: 20,
            include: { event: true, recommendations: true }
        });
        
        const recommendations = await prisma.actionableRecommendation.findMany({
            where: { status: 'PENDING' },
            orderBy: { createdAt: 'desc' },
            take: 10,
            include: { event: true, insight: true }
        });

        res.json({ insights, recommendations });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch intelligence data', details: error.message });
    }
};

exports.updateRecommendationStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['PENDING', 'IMPLEMENTED', 'DISMISSED'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const updated = await prisma.actionableRecommendation.update({
            where: { id: parseInt(id) },
            data: { status }
        });

        res.json({ message: 'Recommendation updated successfully', recommendation: updated });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update recommendation', details: error.message });
    }
};

exports.triggerMockIntelligence = async (req, res) => {
    try {
        const events = await prisma.event.findMany({ take: 1 });
        if (events.length === 0) {
            return res.status(400).json({ error: 'No events found to attach mock data to.' });
        }
        const eventId = events[0].id;

        const agents = ['VenueAgent', 'SchedulingAgent', 'IncidentAgent', 'SponsorshipAgent'];
        const agent = agents[Math.floor(Math.random() * agents.length)];
        
        let type, description, severity, message;

        if (agent === 'VenueAgent') {
            type = 'CAPACITY';
            description = 'Hall capacity has reached 90% and registrations are increasing rapidly.';
            severity = 'WARNING';
            message = 'High crowd density is expected. Consider deploying additional check-in staff and opening an alternative entry point.';
        } else if (agent === 'SchedulingAgent') {
            type = 'SCHEDULE';
            description = 'Session "AI in Cloud" is overlapping with "Future of Web" and both are highly registered.';
            severity = 'WARNING';
            message = 'Move "AI in Cloud" to a later timeslot to maximize attendee participation.';
        } else if (agent === 'IncidentAgent') {
            type = 'GENERAL';
            description = 'Multiple reports of Wi-Fi issues in Hall B.';
            severity = 'CRITICAL';
            message = 'Dispatch IT team immediately to Hall B router array 3.';
        } else {
            type = 'GENERAL';
            description = 'Sponsor booth engagement is below average for Platinum tier.';
            severity = 'INFO';
            message = 'Send push notification to attendees highlighting Platinum sponsor booths with a coffee voucher incentive.';
        }

        const insight = await prisma.eventInsight.create({
            data: {
                eventId,
                type,
                description,
                severity
            }
        });

        const recommendation = await prisma.actionableRecommendation.create({
            data: {
                eventId,
                insightId: insight.id,
                message,
                sourceAgent: agent,
                status: 'PENDING'
            }
        });

        res.json({ message: 'Mock intelligence generated successfully', insight, recommendation });
    } catch (error) {
        res.status(500).json({ error: 'Failed to generate mock intelligence', details: error.message });
    }
};
