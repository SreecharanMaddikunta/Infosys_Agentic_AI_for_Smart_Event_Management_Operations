import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { motion, useAnimation } from 'framer-motion';
import { io } from 'socket.io-client';
import { Camera, AlertTriangle, CalendarDays } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import jsPDF from 'jspdf';

const socket = io('http://localhost:5000');

const HoldToCancelButton = ({ onCancel }) => {
    const [isHolding, setIsHolding] = useState(false);
    const [progress, setProgress] = useState(0);
    const holdTimer = useRef(null);
    const intervalTimer = useRef(null);
    
    const startHold = () => {
        setIsHolding(true);
        let currentProgress = 0;
        
        intervalTimer.current = setInterval(() => {
            currentProgress += 5; // Fill over ~1s (20 steps of 50ms)
            setProgress(currentProgress);
            if (currentProgress >= 100) {
                clearInterval(intervalTimer.current);
                onCancel();
                setIsHolding(false);
                setProgress(0);
            }
        }, 50);
    };

    const stopHold = () => {
        setIsHolding(false);
        setProgress(0);
        clearInterval(intervalTimer.current);
    };

    return (
        <button
            onMouseDown={startHold}
            onMouseUp={stopHold}
            onMouseLeave={stopHold}
            onTouchStart={startHold}
            onTouchEnd={stopHold}
            className="relative overflow-hidden group text-sm font-semibold bg-red-500/10 text-red-500 hover:text-red-600 px-4 py-2 rounded-lg transition border border-red-500/30 flex-1 sm:flex-none flex items-center justify-center gap-2 select-none"
        >
            <div 
                className="absolute left-0 top-0 bottom-0 bg-red-500/20 z-0 transition-all ease-linear"
                style={{ width: `${progress}%`, transitionDuration: isHolding ? '50ms' : '200ms' }}
            />
            <span className="relative z-10 flex items-center gap-2">
                <span>⚠️</span> {isHolding ? 'Holding...' : 'Hold to Cancel'}
            </span>
        </button>
    );
};

export default function StudentDashboard() {
    const [events, setEvents] = useState([]);
    const [myRegistrations, setMyRegistrations] = useState([]);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [recommendations, setRecommendations] = useState([]);
    
    // AI Chatbot state
    const [chatOpen, setChatOpen] = useState(false);
    const [chatMsg, setChatMsg] = useState('');
    const [chatHistory, setChatHistory] = useState([]);

    // Incident Reporting state
    const [incidentModalOpen, setIncidentModalOpen] = useState(false);
    const [incidentReport, setIncidentReport] = useState('');
    const [incidentPhoto, setIncidentPhoto] = useState(null);
    const [incidentType, setIncidentType] = useState('');
    const [incidentTime, setIncidentTime] = useState('');
    const [incidentEventId, setIncidentEventId] = useState('');
    const [incidentSubmitting, setIncidentSubmitting] = useState(false);

    useEffect(() => {
        fetchEvents();
        fetchMyRegistrations();
        // Mock AI recommendations based on trending/first two events
        axios.get('http://localhost:5000/api/events').then(res => setRecommendations(res.data.slice(0, 2)));

        socket.on('SESSION_SCHEDULED', fetchEvents);
        socket.on('SESSION_DELETED', fetchEvents);
        socket.on('event_created', fetchEvents);
        socket.on('event_updated', fetchEvents);
        socket.on('event_deleted', fetchEvents);

        return () => {
            socket.off('SESSION_SCHEDULED');
            socket.off('SESSION_DELETED');
            socket.off('event_created');
            socket.off('event_updated');
            socket.off('event_deleted');
        };
    }, []);

    const fetchEvents = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/events');
            setEvents(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchMyRegistrations = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/registrations/me', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMyRegistrations(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleRegister = async (eventId) => {
        try {
            setLoading(true);
            setMessage(''); setError('');
            const token = localStorage.getItem('token');
            const res = await axios.post('http://localhost:5000/api/registrations', {
                eventId
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessage(res.data.message);
            fetchMyRegistrations();
        } catch (err) {
            setError(err.response?.data?.error || 'Registration failed');
            fetchMyRegistrations(); // Fetch anyway in case they are already registered
        } finally {
            setLoading(false);
        }
    };

    const generateCertificate = (reg) => {
        const doc = new jsPDF({ orientation: 'landscape' });
        doc.setFillColor(79, 70, 229);
        doc.rect(0, 0, 297, 210, 'F');
        doc.setFillColor(255, 255, 255);
        doc.rect(10, 10, 277, 190, 'F');
        
        doc.setFontSize(40);
        doc.setTextColor(30, 41, 59);
        doc.text("Certificate of Attendance", 148, 60, null, null, "center");
        
        doc.setFontSize(20);
        doc.setTextColor(100, 116, 139);
        doc.text("This is to certify that", 148, 90, null, null, "center");
        
        doc.setFontSize(30);
        doc.setTextColor(79, 70, 229);
        doc.text(reg.student?.name || "Student", 148, 115, null, null, "center");
        
        doc.setFontSize(16);
        doc.setTextColor(100, 116, 139);
        doc.text(`has successfully participated in`, 148, 135, null, null, "center");
        
        doc.setFontSize(24);
        doc.setTextColor(30, 41, 59);
        doc.text(reg.event?.title, 148, 150, null, null, "center");
        
        doc.setFontSize(14);
        doc.text(`Date: ${new Date(reg.event?.date).toDateString()}`, 148, 175, null, null, "center");
        
        doc.save(`Certificate_${reg.event?.title}.pdf`);
    };

    const addToCalendar = (event) => {
        const d = new Date(event.date);
        const start = d.toISOString().replace(/-|:|\.\d\d\d/g, "");
        const end = new Date(d.getTime() + 2 * 60 * 60 * 1000).toISOString().replace(/-|:|\.\d\d\d/g, ""); // 2 hours
        const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${start}/${end}&details=${encodeURIComponent(event.description || '')}&location=${encodeURIComponent(event.venue)}`;
        window.open(url, '_blank');
    };

    const handleCancelRegistration = async (registrationId) => {
        try {
            setMessage(''); setError('');
            const token = localStorage.getItem('token');
            const res = await axios.delete(`http://localhost:5000/api/registrations/${registrationId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessage(res.data.message || 'Registration cancelled');
            fetchMyRegistrations();
            fetchEvents();
        } catch (err) {
            setError(err.response?.data?.error || 'Cancellation failed');
        }
    };

    const handleIncidentPhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setIncidentPhoto(reader.result); // Base64 string
            };
            reader.readAsDataURL(file);
        }
    };

    const handleIncidentSubmit = async (e) => {
        e.preventDefault();
        setIncidentSubmitting(true);
        setMessage('');
        setError('');
        try {
            const aiPayload = {
                report_text: incidentReport,
                eventId: incidentEventId ? parseInt(incidentEventId) : null,
                incidentType: incidentType || null,
                incidentTime: incidentTime || null
            };
            const aiRes = await axios.post('http://127.0.0.1:8000/api/incident-agent/classify', aiPayload);

            
            // Construct payload for backend
            const payload = {
                description: incidentReport,
                category: aiRes.data.category,
                severity: aiRes.data.severity,
                priority: aiRes.data.priority,
                responsibleTeam: aiRes.data.responsibleTeam,
                recommendedAction: aiRes.data.recommendedAction,
                photoBase64: incidentPhoto,
                incidentType: incidentType,
                incidentTime: incidentTime,
                eventId: incidentEventId ? parseInt(incidentEventId) : undefined
            };

            const token = localStorage.getItem('token');
            await axios.post('http://localhost:5000/api/incidents', payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            setMessage('Incident reported to staff successfully!');
            setIncidentReport('');
            setIncidentType('');
            setIncidentTime('');
            setIncidentEventId('');
            setIncidentPhoto(null);
            setIncidentModalOpen(false);
        } catch (err) {
            console.error("Failed to submit incident", err);
            setError('Failed to submit incident.');
        } finally {
            setIncidentSubmitting(false);
        }
    };

    const handleChatSubmit = async (e) => {
        e.preventDefault();
        const newHistory = [...chatHistory, { role: 'user', content: chatMsg }];
        setChatHistory(newHistory);
        setChatMsg('');
        
        try {
            const res = await axios.post('http://localhost:8000/ai/chat/', {
                message: chatMsg,
                history: []
            });
            setChatHistory([...newHistory, { role: 'ai', content: res.data.reply }]);
        } catch (err) {
            setChatHistory([...newHistory, { role: 'ai', content: 'AI Service Error.' }]);
        }
    };

    return (
        <div className="space-y-8 relative">
            <motion.h2 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-4xl font-bold gradient-text pb-2"
            >
                User Dashboard
            </motion.h2>
            {message && <div className="bg-green-500/20 text-green-200 p-4 rounded-lg">{message}</div>}
            {error && <div className="bg-red-500/20 text-red-500 p-4 rounded-lg font-medium">{error}</div>}
            
            {/* AI Recommendations */}
            <div className="bg-gradient-to-r from-primary/10 to-accent/10 p-6 rounded-2xl border border-primary/20">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><span>✨</span> AI Recommended For You</h3>
                <div className="flex gap-4 overflow-x-auto pb-2">
                    {recommendations.map((event, idx) => (
                        <div key={`rec-${event.id}`} className="glass min-w-[250px] p-4 rounded-xl flex-shrink-0">
                            <h4 className="font-bold text-lg truncate">{event.title}</h4>
                            <p className="text-xs text-muted-foreground mt-1 mb-3">{new Date(event.date).toDateString()}</p>
                            {myRegistrations.some(r => r.eventId === event.id) ? (
                                <button disabled className="bg-green-500/20 text-green-400 w-full py-1.5 rounded-lg text-sm font-semibold cursor-not-allowed">Registered</button>
                            ) : (
                                <button onClick={() => handleRegister(event.id)} className="bg-primary/20 text-primary w-full py-1.5 rounded-lg text-sm font-semibold hover:bg-primary hover:text-white transition">Register</button>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                    <h3 className="text-2xl font-semibold mb-6 text-primary flex items-center gap-2">
                        <span>📅</span> Upcoming Events
                    </h3>
                    <div className="space-y-4">
                        {events.map((event, idx) => (
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                whileHover={{ scale: 1.02 }}
                                key={event.id} 
                                className="glass p-6 rounded-2xl flex flex-col items-start gap-4 hover:border-primary/50 transition-colors w-full"
                            >
                                <div className="w-full flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                    <div>
                                        <h4 className="text-xl font-bold">{event.title}</h4>
                                        <p className="text-sm text-muted-foreground mt-1 mb-3">🗓️ {new Date(event.date).toDateString()} | 📍 {event.venue}</p>
                                        <div className="flex flex-wrap items-center gap-2 mt-2">
                                            <span className="text-sm font-bold text-primary/80 uppercase tracking-widest mr-1 flex items-center gap-1"><span>🤝</span> Sponsors:</span>
                                            {event.sponsors && event.sponsors.length > 0 ? (
                                                event.sponsors.map(sponsor => (
                                                    <span key={sponsor.id} className="bg-white/10 border border-white/20 text-white font-medium px-3 py-1 rounded-full text-xs shadow-sm">
                                                        {sponsor.name}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-xs text-muted-foreground italic">None</span>
                                            )}
                                        </div>
                                    </div>
                                    {myRegistrations.some(r => r.eventId === event.id) ? (
                                        <button disabled className="bg-green-500/20 text-green-400 border border-green-500/30 px-6 py-2 rounded-xl w-full sm:w-auto font-semibold shadow-lg cursor-not-allowed mt-4 sm:mt-0">
                                            Registered
                                        </button>
                                    ) : (
                                        <button disabled={loading} onClick={() => handleRegister(event.id)} className={`px-6 py-2 rounded-xl transition-all w-full sm:w-auto font-semibold shadow-lg mt-4 sm:mt-0 ${loading ? 'bg-muted text-muted-foreground cursor-wait' : 'bg-primary/10 text-primary border border-primary/50 hover:bg-primary hover:text-white shadow-primary/10'}`}>
                                            {loading ? 'Processing...' : 'Register Now'}
                                        </button>
                                    )}
                                </div>
                                {event.sessions && event.sessions.length > 0 && (
                                    <div className="w-full mt-4 border-t border-border pt-4">
                                        <h5 className="font-semibold text-sm mb-3 flex items-center gap-2"><span>🕒</span> Event Schedule</h5>
                                        <div className="space-y-2">
                                            {event.sessions.map(s => (
                                                <div key={s.id} className="bg-secondary/50 p-3 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-sm">
                                                    <div>
                                                        <span className="font-bold text-primary">{s.title || 'Session'}</span>
                                                        <div className="text-muted-foreground text-xs mt-1">
                                                            {new Date(s.startTime).toLocaleString()} - {new Date(s.endTime).toLocaleTimeString()}
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col items-end gap-1 text-xs">
                                                        {s.speaker && <span className="font-semibold bg-accent/10 text-accent px-2 py-0.5 rounded">🗣️ {s.speaker.name}</span>}
                                                        {s.venue && <span className="font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded">📍 {s.venue.name}</span>}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </div>
                </div>
                
                <div>
                    <h3 className="text-2xl font-semibold mb-6 text-accent flex items-center gap-2">
                        <span>🎫</span> My Tickets
                    </h3>
                    <div className="space-y-4">
                        {myRegistrations.map((reg, idx) => (
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                key={reg.id} 
                                className="glass relative overflow-hidden p-6 rounded-2xl flex flex-col sm:flex-row items-center gap-6 group hover:shadow-xl transition-all duration-300 border border-white/10"
                            >
                                {/* Ticket cutout effect */}
                                <div className="hidden sm:block absolute -left-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-[#0f172a] rounded-full border border-white/5"></div>
                                <div className="hidden sm:block absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-[#0f172a] rounded-full border border-white/5"></div>

                                <div className="bg-white p-3 rounded-xl shrink-0 shadow-lg border border-gray-100 flex items-center justify-center transition-transform duration-300 group-hover:scale-105 z-10">
                                    {reg.registrationId ? (
                                        <QRCodeSVG 
                                            value={reg.registrationId} 
                                            size={100} 
                                            bgColor={"#ffffff"}
                                            fgColor={"#4f46e5"} 
                                            level={"H"}
                                            marginSize={1}
                                        />
                                    ) : (
                                        <div className="w-[100px] h-[100px] flex items-center justify-center bg-gray-50 text-gray-400 text-xs text-center rounded-lg animate-pulse font-semibold">
                                            Generating...
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 w-full z-10 border-l border-white/10 pl-0 sm:pl-6">
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">{reg.event?.title}</h4>
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm
                                            ${reg.status === 'COMPLETED' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 
                                              reg.status === 'APPROVED' ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 
                                              reg.status === 'REJECTED' ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 
                                              reg.status === 'WAITLISTED' ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30' : 
                                              'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'}`}
                                        >
                                            {reg.status}
                                        </span>
                                    </div>
                                    
                                    <div className="space-y-1 mb-4">
                                        <p className="text-sm font-mono text-muted-foreground flex items-center gap-2">
                                            <span className="text-primary/70">ID:</span> 
                                            <span className="bg-primary/10 px-2 py-0.5 rounded text-primary font-bold">{reg.registrationId || 'Pending'}</span>
                                        </p>
                                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                                            <span className="text-primary/70">📅</span> 
                                            {new Date(reg.event?.date).toDateString()}
                                        </p>
                                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                                            <span className="text-primary/70">📍</span> 
                                            {reg.event?.venue}
                                        </p>
                                    </div>
                                    
                                    <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-white/5">
                                        {reg.status === 'COMPLETED' ? (
                                            <button onClick={() => generateCertificate(reg)} className="text-sm font-semibold bg-purple-600 text-white hover:bg-purple-500 px-4 py-2 rounded-lg transition shadow-lg shadow-purple-500/20 flex-1 sm:flex-none flex items-center justify-center gap-2">
                                                <span>🎓</span> Download Certificate
                                            </button>
                                        ) : (
                                            <>
                                                <button onClick={() => addToCalendar(reg.event)} className="text-sm font-semibold bg-primary/20 text-primary hover:bg-primary hover:text-white px-4 py-2 rounded-lg transition border border-primary/30 flex-1 sm:flex-none flex items-center justify-center gap-2">
                                                    <span>📅</span> Add to Calendar
                                                </button>
                                                <HoldToCancelButton onCancel={() => handleCancelRegistration(reg.id)} />
                                            </>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Floating AI Chatbot Button */}
            <div className="fixed bottom-10 right-10 z-50">
                {chatOpen && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass w-80 h-96 mb-4 rounded-2xl flex flex-col shadow-2xl border-primary/30">
                        <div className="bg-primary/20 p-4 rounded-t-2xl border-b border-primary/20 flex justify-between items-center">
                            <h4 className="font-bold">AI Assistant</h4>
                            <button onClick={() => setChatOpen(false)} className="text-muted-foreground hover:text-white">&times;</button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {chatHistory.map((msg, i) => (
                                <div key={i} className={`p-3 rounded-lg text-sm max-w-[85%] ${msg.role === 'user' ? 'bg-primary text-white self-end ml-auto' : 'bg-muted text-foreground'}`}>
                                    {msg.content}
                                </div>
                            ))}
                        </div>
                        <form onSubmit={handleChatSubmit} className="p-3 border-t border-border flex gap-2">
                            <input type="text" className="flex-1 bg-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" value={chatMsg} onChange={e=>setChatMsg(e.target.value)} placeholder="Ask something..."/>
                            <button type="submit" className="bg-primary px-3 rounded-lg text-white font-bold">Go</button>
                        </form>
                    </motion.div>
                )}
                <button onClick={() => setChatOpen(!chatOpen)} className="bg-primary text-white w-14 h-14 rounded-full shadow-lg shadow-primary/40 flex items-center justify-center text-2xl hover:scale-110 transition float-right">
                    ✨
                </button>
            </div>

            {/* Report Issue Modal Overlay */}
            {incidentModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass w-full max-w-lg rounded-2xl shadow-2xl border border-red-500/30 p-6 bg-background relative">
                        <div className="flex justify-between items-center mb-6">
                            <h4 className="text-xl font-bold text-red-500 flex items-center gap-2">
                                <AlertTriangle size={24} /> Report an Issue
                            </h4>
                            <button onClick={() => setIncidentModalOpen(false)} className="text-muted-foreground hover:text-foreground bg-white/5 w-8 h-8 rounded-full flex items-center justify-center">&times;</button>
                        </div>
                        <form onSubmit={handleIncidentSubmit} className="flex flex-col gap-5">
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Which Event? (Optional)</label>
                                    <select 
                                        className="w-full bg-input rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50 border border-border"
                                        value={incidentEventId}
                                        onChange={(e) => setIncidentEventId(e.target.value)}
                                    >
                                        <option value="">Select Event...</option>
                                        {events.map(ev => (
                                            <option key={ev.id} value={ev.id}>{ev.title}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Incident Time</label>
                                    <input 
                                        type="datetime-local" 
                                        className="w-full bg-input rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50 border border-border text-foreground"
                                        value={incidentTime}
                                        min={incidentEventId && events.find(e => e.id === parseInt(incidentEventId)) ? new Date(new Date(events.find(e => e.id === parseInt(incidentEventId)).date).setHours(0,0,0,0) - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : undefined}
                                        max={incidentEventId && events.find(e => e.id === parseInt(incidentEventId)) ? new Date(new Date(events.find(e => e.id === parseInt(incidentEventId)).date).setHours(23,59,59,999) - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)}
                                        onChange={(e) => setIncidentTime(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Type of Incident</label>
                                <select 
                                    className="w-full bg-input rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50 border border-border"
                                    value={incidentType}
                                    onChange={(e) => setIncidentType(e.target.value)}
                                    required
                                >
                                    <option value="">Select Type...</option>
                                    <option value="Technical">Technical (IT/AV)</option>
                                    <option value="Medical">Medical / Emergency</option>
                                    <option value="Security">Security / Safety</option>
                                    <option value="Logistics">Logistics / Facility</option>
                                    <option value="Content">Content / Speaker</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">What went wrong?</label>
                                <textarea 
                                    className="w-full bg-input rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50 border border-border resize-none" 
                                    rows="4" 
                                    required
                                    placeholder="e.g., The microphone is completely broken in Hall A and attendees can't hear."
                                    value={incidentReport}
                                    onChange={(e) => setIncidentReport(e.target.value)}
                                />
                            </div>
                            
                            <div className="border border-dashed border-border rounded-xl p-4 bg-white/5 hover:bg-white/10 transition text-center cursor-pointer relative">
                                <input 
                                    type="file" 
                                    accept="image/*"
                                    onChange={handleIncidentPhotoChange}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                                <div className="flex flex-col items-center justify-center gap-2 pointer-events-none">
                                    <Camera size={24} className="text-muted-foreground" />
                                    <span className="text-sm font-medium text-muted-foreground">Click or drag to attach a photo (Optional)</span>
                                </div>
                            </div>
                            
                            {incidentPhoto && (
                                <div className="relative rounded-xl overflow-hidden shadow-sm">
                                    <img src={incidentPhoto} alt="Preview" className="w-full max-h-48 object-cover" />
                                    <button 
                                        type="button" 
                                        onClick={() => setIncidentPhoto(null)} 
                                        className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70"
                                    >
                                        &times;
                                    </button>
                                </div>
                            )}
                            
                            <button 
                                type="submit" 
                                disabled={incidentSubmitting}
                                className="bg-red-500 text-white px-4 py-3 rounded-xl font-bold hover:bg-red-600 transition disabled:opacity-50 mt-2 flex items-center justify-center gap-2"
                            >
                                {incidentSubmitting ? 'Submitting Report...' : 'Submit Report'}
                            </button>
                        </form>
                    </motion.div>
                </div>
            )}
            
            {/* Floating Report Issue Button (Corner) */}
            <div className="fixed bottom-10 left-10 z-50">
                <button onClick={() => setIncidentModalOpen(true)} className="bg-red-500 text-white px-5 h-14 rounded-full shadow-lg shadow-red-500/40 flex items-center justify-center gap-2 font-bold hover:scale-105 transition">
                    <AlertTriangle size={20} /> Report Issue
                </button>
            </div>
        </div>
    );
}
