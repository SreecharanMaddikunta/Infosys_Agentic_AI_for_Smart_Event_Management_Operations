const prisma = require('../utils/prisma');
const axios = require('axios');
const crypto = require('crypto');
const { sendConfirmationEmail } = require('../utils/emailService');
const { triggerIntelligenceAnalysis } = require('../services/intelligenceService');

const registerForEvent = async (req, res) => {
    try {
        const { eventId } = req.body;
        const studentId = req.user.id; // from auth middleware
        
        // Fetch real student data
        const student = await prisma.user.findUnique({ where: { id: studentId } });
        if (!student) return res.status(404).json({ error: 'User not found' });
        
        const name = student.name;
        const email = student.email;
        const phone = student.phone || '0000000000';
        const college = student.college || 'Unknown';

        // Fetch the event to check capacity
        const event = await prisma.event.findUnique({ where: { id: parseInt(eventId) } });
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        // 1. AI Validation
        try {
            const aiValRes = await axios.post('http://localhost:8000/ai/validate/', {
                name, phone, email, college
            });
            if (!aiValRes.data.valid) {
                return res.status(400).json({ error: 'AI Validation Failed', details: aiValRes.data.reason });
            }
        } catch (err) {
            console.error('AI validation service unreachable', err.message);
        }

        // 2. AI Duplicate Detection
        try {
            const aiDupRes = await axios.post('http://localhost:8000/ai/duplicate/', {
                name, email, eventId
            });
            if (aiDupRes.data.isDuplicate) {
                // If AI detects a duplicate, it's flagged for manual Admin review
                const registrationId = `INF-${new Date().getFullYear()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
                await prisma.registration.create({
                    data: { studentId, eventId: parseInt(eventId), registrationId, status: 'REJECTED' }
                });
                return res.status(400).json({ error: 'Flagged as Duplicate Registration by AI. Awaiting manual admin review.', confidence: aiDupRes.data.confidence });
            }
        } catch (err) {
            console.error('AI duplicate service unreachable', err.message);
        }

        // 3. Waitlist Engine (Check Capacity)
        const currentApproved = await prisma.registration.count({
            where: { eventId: parseInt(eventId), status: 'APPROVED' }
        });

        const isWaitlisted = currentApproved >= event.slots;
        const assignedStatus = isWaitlisted ? 'WAITLISTED' : 'APPROVED';

        // 4. Store data
        const registrationId = `INF-${new Date().getFullYear()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
        
        const registration = await prisma.registration.create({
            data: {
                studentId,
                eventId: parseInt(eventId),
                registrationId,
                status: assignedStatus,
                mailStatus: 'PENDING'
            }
        });
        
        const io = req.app.get('io');
        if (io) io.emit('registration_created', registration);

        // 5. Send Email if Approved
        if (assignedStatus === 'APPROVED') {
            const emailSent = await sendConfirmationEmail(
                email, name, event.title, registrationId, event.date, event.venue
            );
            
            if (emailSent) {
                await prisma.registration.update({
                    where: { id: registration.id },
                    data: { mailStatus: 'SENT' }
                });
            }
        }

        // Trigger Event Intelligence Engine
        triggerIntelligenceAnalysis(parseInt(eventId), 'REGISTRATION', {
            current_approved: currentApproved + (assignedStatus === 'APPROVED' ? 1 : 0),
            slots: event.slots
        });

        res.status(201).json({
            message: isWaitlisted ? 'Event is full! You have been added to the waitlist.' : 'Registration Completed Successfully',
            registrationId,
            status: assignedStatus,
            registration
        });
    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'You are already registered for this event.' });
        }
        res.status(500).json({ error: 'Server error', details: error.message });
    }
};

const getMyRegistrations = async (req, res) => {
    try {
        const studentId = req.user.id;
        const registrations = await prisma.registration.findMany({
            where: { studentId },
            include: { event: true }
        });
        res.json(registrations);
    } catch (error) {
        res.status(500).json({ error: 'Server error', details: error.message });
    }
};

const cancelRegistration = async (req, res) => {
    try {
        const studentId = req.user.id;
        const registrationId = parseInt(req.params.id);

        const registration = await prisma.registration.findFirst({
            where: { id: registrationId, studentId }
        });

        if (!registration) {
            return res.status(404).json({ error: 'Registration not found' });
        }

        // We can either completely delete or mark as CANCELLED
        await prisma.registration.delete({
            where: { id: registrationId }
        });

        res.json({ message: 'Registration cancelled successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Server error', details: error.message });
    }
};

module.exports = { registerForEvent, getMyRegistrations, cancelRegistration };
