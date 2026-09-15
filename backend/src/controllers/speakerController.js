const prisma = require('../utils/prisma');
const axios = require('axios');

// In-memory lock store for speakers
// Key: speakerId (string), Value: { lockedBy: string, lockedAt: number, timeoutId: timeout }
const speakerLocks = new Map();
const LOCK_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

exports.getAllSpeakers = async (req, res) => {
    try {
        const speakers = await prisma.speaker.findMany({
            include: {
                sessions: {
                    include: {
                        event: true
                    }
                }
            }
        });
        res.json(speakers);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createSpeaker = async (req, res) => {
    try {
        const { name, email, bio, expertise, availability } = req.body;
        const speaker = await prisma.speaker.create({
            data: {
                name,
                email,
                bio,
                expertise: JSON.stringify(expertise),
                availability: JSON.stringify(availability)
            }
        });
        res.status(201).json(speaker);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.suggestBestSpeakers = async (req, res) => {
    try {
        const { sessionTopic, startTime, endTime } = req.body;
        const speakers = await prisma.speaker.findMany();
        
        try {
            // Pass data to Python AI service
            const aiResponse = await axios.post('http://127.0.0.1:8000/ai/speaker/suggest', {
                topic: sessionTopic,
                startTime,
                endTime,
                speakers: speakers
            }, { timeout: 5000 });

            if (aiResponse.data.error || !Array.isArray(aiResponse.data) || aiResponse.data.length === 0) {
                throw new Error(aiResponse.data.error || "Invalid or empty AI response");
            }

            // Filter out low scores if they don't match the topic
            let filteredAi = aiResponse.data;
            if (sessionTopic) {
                filteredAi = aiResponse.data.filter(f => parseInt(f.priority_score) > 50);
            }
            
            // Return only the top 10 priority speakers
            return res.json(filteredAi.slice(0, 10));
        } catch (aiError) {
            console.error("AI Service offline or error. Using Node.js fallback:", aiError.message);
            const topic = (sessionTopic || "").toLowerCase();
            const fallback = speakers.map(s => {
                let score = 50;
                if (!topic) {
                    score = score + parseInt(s.pastRating || 0) * 5;
                } else {
                    const expertise = (s.expertise || "").toLowerCase();
                    const bio = (s.bio || "").toLowerCase();
                    if (expertise.includes(topic)) score += 40;
                    else if (bio.includes(topic)) score += 20;
                    score += parseInt(s.pastRating || 0) * 2;
                }
                return {
                    speaker: s,
                    priority_score: Math.min(score, 100),
                    reasoning: `Node Fallback: Heuristic priority based on expertise match.`
                };
            });
            fallback.sort((a, b) => b.priority_score - a.priority_score);
            
            // If a topic was searched, filter out anyone who didn't get a bonus score (score <= 50)
            let filteredFallback = fallback;
            if (topic) {
                filteredFallback = fallback.filter(f => f.priority_score > 50);
            }
            
            return res.json(filteredFallback.slice(0, 10));
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Lock Speaker (Now just creates a booking session)
exports.lockSpeaker = async (req, res) => {
    const { id } = req.params;
    const { eventId, startTime, endTime } = req.body; 

    try {
        if (eventId && startTime && endTime) {
            const start = new Date(startTime);
            const end = new Date(endTime);
            
            // Check for time conflict
            const overlappingSession = await prisma.session.findFirst({
                where: {
                    speakerId: parseInt(id),
                    startTime: { lt: end },
                    endTime: { gt: start }
                }
            });
            
            if (overlappingSession) {
                return res.status(409).json({ error: 'Speaker is already booked for another session during this time.' });
            }
            
            const session = await prisma.session.create({
                data: {
                    eventId: parseInt(eventId),
                    speakerId: parseInt(id),
                    title: 'Speaker Session',
                    startTime: start,
                    endTime: end
                }
            });
            
            const io = req.app.get('io');
            if (io) {
                io.emit('SESSION_SCHEDULED', session);
            }
        }
        res.json({ success: true, message: 'Speaker booked successfully.' });
    } catch (dbError) {
        return res.status(500).json({ error: 'Failed to create speaker session in database.', details: dbError.message });
    }
};

// Unlock Speaker (Deprecated, now use DELETE /api/sessions/:id)
exports.unlockSpeaker = async (req, res) => {
    res.json({ success: true, message: 'Deprecated: use DELETE /api/sessions/:id instead' });
};
