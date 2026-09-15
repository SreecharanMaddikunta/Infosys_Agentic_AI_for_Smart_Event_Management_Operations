require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const eventRoutes = require('./routes/eventRoutes');
const registrationRoutes = require('./routes/registrationRoutes');
const adminRoutes = require('./routes/adminRoutes');
const venueRoutes = require('./routes/venueRoutes');
const speakerRoutes = require('./routes/speakerRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
const alertRoutes = require('./routes/alertRoutes');
// const aiRoutes = require('./routes/aiRoutes'); // Will proxy to Python service

const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE']
    }
});
app.set('io', io);
// Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/venues', venueRoutes);
app.use('/api/speakers', speakerRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/alerts', alertRoutes);
const analyticsRoutes = require('./routes/analyticsRoutes');
const sponsorRoutes = require('./routes/sponsorRoutes');
const incidentRoutes = require('./routes/incidentRoutes');
const telemetryRoutes = require('./routes/telemetryRoutes');

// app.use('/api/ai', aiRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/sponsors', sponsorRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/telemetry', telemetryRoutes);
// Base route
app.get('/', (req, res) => {
    res.send('Infosys Intelligent Event Management Platform API is running!');
});
// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!', details: err.message });
});
const PORT = process.env.PORT || 5000;

// AI Predictive Alerts Polling (Demo every 30s)
const axios = require('axios');
const { createAlert } = require('./routes/../controllers/alertController');

setInterval(async () => {
    try {
        const response = await axios.post('http://localhost:8000/api/alert-agent/predict', {
            venueCapacity: 1000,
            currentAttendance: 850 + Math.floor(Math.random() * 50), // 850-900
            registrationVelocity: 25 + Math.floor(Math.random() * 10), // 25-35
            recentIncidents: 4 // Hardcoded to trigger incident alert too
        });
        
        const alerts = response.data.alerts || [];
        for (const alert of alerts) {
            await createAlert(alert.type, alert.message, 'AI', io);
        }
    } catch (error) {
        // Ignore if AI service is not running or other errors
    }
}, 60000); // Poll every 60s

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Trigger nodemon restart
