import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Camera, AlertTriangle, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ReportIncidentForm = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [events, setEvents] = useState([]);
    
    // Form fields
    const [eventId, setEventId] = useState('');
    const [incidentType, setIncidentType] = useState('');
    const [incidentTime, setIncidentTime] = useState('');
    const [report, setReport] = useState('');
    const [photo, setPhoto] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        // Fetch events for dropdown
        const fetchEvents = async () => {
            try {
                const res = await axios.get('http://localhost:5000/api/events');
                setEvents(res.data);
            } catch (err) {
                console.error("Failed to load events", err);
            }
        };
        fetchEvents();
    }, []);

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhoto(reader.result); // Base64 string
                setPhotoPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setMessage('');
        setError('');
        try {
            // Send to AI for classification
            const aiPayload = {
                report_text: report,
                eventId: eventId ? parseInt(eventId) : null,
                incidentType: incidentType || null,
                incidentTime: incidentTime || null
            };
            const aiRes = await axios.post('http://127.0.0.1:8000/api/incident-agent/classify', aiPayload);
            
            // Construct payload for Node backend
            const payload = {
                description: report,
                category: aiRes.data.category,
                severity: aiRes.data.severity,
                priority: aiRes.data.priority,
                responsibleTeam: aiRes.data.responsibleTeam,
                recommendedAction: aiRes.data.recommendedAction,
                photoBase64: photo,
                incidentType: incidentType,
                incidentTime: incidentTime,
                eventId: eventId ? parseInt(eventId) : undefined
            };

            const token = localStorage.getItem('token');
            await axios.post('http://localhost:5000/api/incidents', payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            setMessage('Incident reported to staff successfully!');
            setReport('');
            setEventId('');
            setIncidentType('');
            setIncidentTime('');
            setPhoto(null);
            setPhotoPreview(null);
            
            // Close modal after short delay
            setTimeout(() => {
                setIsOpen(false);
                setMessage('');
            }, 2000);
            
        } catch (err) {
            console.error("Failed to submit incident", err.response?.data || err.message);
            setError(`Failed to submit incident. ${err.response?.data?.error || err.response?.data?.details || err.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            {/* Floating Report Issue Button (Corner) */}
            <div className="fixed bottom-10 right-10 z-50">
                <button 
                    onClick={() => setIsOpen(true)} 
                    className="bg-red-500 text-white px-5 h-14 rounded-full shadow-lg shadow-red-500/40 flex items-center justify-center gap-2 font-bold hover:scale-105 transition"
                >
                    <AlertTriangle size={20} /> Report Issue
                </button>
            </div>

            {/* Modal Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }} 
                            animate={{ opacity: 1, scale: 1 }} 
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="glass w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl border border-red-500/30 p-6 bg-background relative"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h4 className="text-2xl font-bold text-red-500 flex items-center gap-2">
                                    <AlertTriangle /> Report an Incident
                                </h4>
                                <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground bg-white/5 w-8 h-8 rounded-full flex items-center justify-center transition">&times;</button>
                            </div>

                            {message && (
                                <div className="mb-6 p-4 rounded-xl font-medium bg-green-500/20 text-green-500 border border-green-500/30">
                                    {message}
                                </div>
                            )}

                            {error && (
                                <div className="mb-6 p-4 rounded-xl font-medium bg-red-500/20 text-red-500 border border-red-500/30">
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-semibold mb-2">Which Event? (Optional)</label>
                                        <select 
                                            className="w-full bg-input border border-border p-3 rounded-xl focus:ring-2 focus:ring-red-500/50 outline-none"
                                            value={eventId}
                                            onChange={(e) => setEventId(e.target.value)}
                                        >
                                            <option value="">Select Event...</option>
                                            {events.map(ev => (
                                                <option key={ev.id} value={ev.id}>{ev.title}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold mb-2">Incident Time</label>
                                        <input 
                                            type="datetime-local" 
                                            className="w-full bg-input border border-border p-3 rounded-xl focus:ring-2 focus:ring-red-500/50 outline-none text-foreground"
                                            value={incidentTime}
                                            min={eventId && events.find(e => e.id === parseInt(eventId)) ? new Date(new Date(events.find(e => e.id === parseInt(eventId)).date).setHours(0,0,0,0) - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : undefined}
                                            max={eventId && events.find(e => e.id === parseInt(eventId)) ? new Date(new Date(events.find(e => e.id === parseInt(eventId)).date).setHours(23,59,59,999) - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)}
                                            onChange={(e) => setIncidentTime(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold mb-2">Type of Incident</label>
                                    <select 
                                        className="w-full bg-input border border-border p-3 rounded-xl focus:ring-2 focus:ring-red-500/50 outline-none"
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
                                    <label className="block text-sm font-semibold mb-2">Incident Description</label>
                                    <textarea 
                                        className="w-full bg-input border border-border p-4 rounded-xl focus:ring-2 focus:ring-red-500/50 outline-none resize-none transition" 
                                        rows="4" 
                                        required
                                        placeholder="Describe what went wrong... (e.g., The microphone is not working in Hall A)"
                                        value={report}
                                        onChange={(e) => setReport(e.target.value)}
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-semibold mb-2">Attach Photo (Optional)</label>
                                    <div className="border-2 border-dashed border-border rounded-xl p-6 bg-white/5 hover:bg-white/10 transition text-center cursor-pointer relative group">
                                        <input 
                                            type="file" 
                                            accept="image/*"
                                            onChange={handlePhotoChange}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        />
                                        <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground group-hover:text-foreground transition">
                                            <Camera size={32} />
                                            <span className="text-sm font-medium">Click or drag to attach a photo</span>
                                        </div>
                                    </div>
                                </div>

                                {photoPreview && (
                                    <div className="relative rounded-xl overflow-hidden shadow-md max-h-64 inline-block self-start border border-border">
                                        <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                                        <button 
                                            type="button" 
                                            onClick={() => { setPhoto(null); setPhotoPreview(null); }} 
                                            className="absolute top-2 right-2 bg-black/50 hover:bg-black/80 text-white rounded-full p-1.5 transition"
                                        >
                                            &times;
                                        </button>
                                    </div>
                                )}

                                <button 
                                    type="submit" 
                                    disabled={isSubmitting}
                                    className="bg-red-500 text-white px-6 py-3 rounded-xl hover:bg-red-600 transition disabled:opacity-50 flex items-center justify-center gap-2 font-bold shadow-lg shadow-red-500/20 w-full sm:w-auto self-end mt-2"
                                >
                                    {isSubmitting ? 'Processing...' : <><Send size={18} /> Submit Incident</>}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
};

export default ReportIncidentForm;
