const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

exports.getAdminStats = async (req, res) => {
    try {
        const totalReg = await prisma.registration.count();
        const duplicates = await prisma.registration.count({
            where: { status: 'REJECTED' }
        });
        const aiPredicted = Math.round(totalReg * 1.15) || 0;
        
        const allRegistrations = await prisma.registration.findMany({
            include: { student: true }
        });
        
        const categoryStats = {};
        const genderStats = {};
        
        allRegistrations.forEach(reg => {
            if (reg.student) {
                const cat = reg.student.category || 'Unknown';
                const gen = reg.student.gender || 'Unknown';
                categoryStats[cat] = (categoryStats[cat] || 0) + 1;
                genderStats[gen] = (genderStats[gen] || 0) + 1;
            }
        });

        res.json({ 
            totalReg, 
            aiPredicted, 
            duplicatesPrevented: duplicates,
            categoryStats,
            genderStats
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch admin stats' });
    }
};

exports.getRegistrations = async (req, res) => {
    try {
        const { status } = req.query;
        const registrations = await prisma.registration.findMany({
            where: status ? { status } : undefined,
            include: { student: true, event: true }
        });
        res.json(registrations);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch registrations' });
    }
};

exports.getEventAttendees = async (req, res) => {
    try {
        const { id } = req.params;
        const eventId = parseInt(id);
        
        const registrations = await prisma.registration.findMany({
            where: { eventId },
            include: { student: true }
        });

        const attendances = await prisma.attendance.findMany({
            where: { eventId }
        });

        const attendees = registrations.map(reg => {
            const attendance = attendances.find(a => a.studentId === reg.studentId);
            return {
                ...reg,
                attendance: attendance || null
            };
        });

        res.json(attendees);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch attendees' });
    }
};

exports.overrideRegistration = async (req, res) => {
    try {
        const { id } = req.params;
        const registration = await prisma.registration.update({
            where: { id: parseInt(id) },
            data: { status: 'APPROVED' },
            include: { student: true, event: true }
        });
        // We could also send email here using emailService if we wanted to
        res.json({ message: 'Registration approved', registration });
    } catch (error) {
        res.status(500).json({ error: 'Failed to override registration' });
    }
};
