const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../utils/prisma');

const register = async (req, res) => {
    try {
        const { name, email, password, role, category, gender, phone, college } = req.body;

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already in use.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: role || 'STUDENT',
                category: category || 'Student',
                gender: gender || 'Prefer not to say',
                phone,
                college
            }
        });

        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
        
        res.status(201).json({ 
            message: 'User registered successfully', 
            token,
            user: { id: user.id, name: user.name, email: user.email, role: user.role, category: user.category, gender: user.gender }
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error', details: error.message });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return res.status(400).json({ error: 'Invalid email or password.' });

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(400).json({ error: 'Invalid email or password.' });

        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });

        res.json({
            message: 'Login successful',
            token,
            user: { id: user.id, name: user.name, email: user.email, role: user.role, category: user.category, gender: user.gender }
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error', details: error.message });
    }
};

const registerSponsor = async (req, res) => {
    try {
        const { name, email, password, companyName, industry } = req.body;

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already in use.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: 'SPONSOR',
                category: 'Sponsor',
                companyName,
                industry
            }
        });

        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });

        res.status(201).json({ 
            message: 'Sponsor registered successfully', 
            token,
            user: { id: user.id, name: user.name, email: user.email, role: user.role, companyName: user.companyName }
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error', details: error.message });
    }
};

module.exports = { register, login, registerSponsor };
