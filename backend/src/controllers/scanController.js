const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
const { triggerIntelligenceAnalysis } = require('../services/intelligenceService');

exports.scanTicket = async (req, res) => {
    try {
        const { registrationId } = req.body;
        
        if (!registrationId) {
            return res.status(400).json({ error: 'Registration ID is required' });
        }

        const registration = await prisma.registration.findUnique({
            where: { registrationId },
            include: { student: true, event: true }
        });

        if (!registration) {
            return res.status(404).json({ error: 'Invalid Ticket: Registration not found' });
        }

        if (registration.status !== 'APPROVED' && registration.status !== 'COMPLETED') {
            return res.status(400).json({ error: `Ticket cannot be scanned. Current status: ${registration.status}` });
        }

        // Check if already attended
        const existingAttendance = await prisma.attendance.findUnique({
            where: {
                studentId_eventId: {
                    studentId: registration.studentId,
                    eventId: registration.eventId
                }
            }
        });

        if (existingAttendance) {
            if (existingAttendance.checkOutTime) {
                return res.status(400).json({ error: 'Student has already checked out.' });
            }

            const checkOutTime = new Date();
            const durationMinutes = Math.floor((checkOutTime - new Date(existingAttendance.checkInTime)) / 60000);

            await prisma.attendance.update({
                where: { id: existingAttendance.id },
                data: {
                    checkOutTime,
                    durationMinutes
                }
            });

            return res.json({ 
                message: `Check-out successful! Duration: ${durationMinutes} mins`, 
                student: registration.student.name, 
                event: registration.event.title 
            });
        }

        // Create attendance record (Check-in)
        await prisma.attendance.create({
            data: {
                studentId: registration.studentId,
                eventId: registration.eventId,
                status: 'PRESENT'
            }
        });
        
        // Update registration status to COMPLETED
        await prisma.registration.update({
            where: { id: registration.id },
            data: { status: 'COMPLETED' }
        });

        // Trigger Event Intelligence Engine
        const totalAttendees = await prisma.attendance.count({ where: { eventId: registration.eventId, checkOutTime: null } });
        const capacityPercentage = Math.round((totalAttendees / registration.event.slots) * 100);
        
        triggerIntelligenceAnalysis(registration.eventId, 'CAPACITY', {
            capacity_percentage: capacityPercentage,
            total_attendees: totalAttendees,
            venue_capacity: registration.event.slots
        });

        // Emit VIP Arrival Alert
        if (registration.student.category === 'VIP' || registration.student.category === 'Sponsor') {
            const io = req.app.get('io');
            if (io) {
                io.emit('vip_arrival', {
                    name: registration.student.name,
                    category: registration.student.category,
                    eventTitle: registration.event.title,
                    time: new Date().toISOString()
                });
            }
        }

        res.json({ 
            message: 'Check-in successful!', 
            student: registration.student.name, 
            event: registration.event.title 
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to scan ticket' });
    }
};
