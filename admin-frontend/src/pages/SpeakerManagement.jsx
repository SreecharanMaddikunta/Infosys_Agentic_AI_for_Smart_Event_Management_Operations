import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { io } from 'socket.io-client';
import { Plus, Search, Lock, Unlock, X, XCircle } from 'lucide-react';

const socket = io('http://localhost:5000');

export default function SpeakerManagement() {
    const [allSpeakers, setAllSpeakers] = useState([]);
    const [displaySpeakers, setDisplaySpeakers] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [topic, setTopic] = useState('');
    
    // Locks state
    const [lockedSpeakers, setLockedSpeakers] = useState({});
    
    // Add form state
    const [isAddingSpeaker, setIsAddingSpeaker] = useState(false);
    const [newSpeaker, setNewSpeaker] = useState({ name: '', email: '', bio: '', expertise: '', availability: '' });

    // Booking modal state
    const [bookingSpeaker, setBookingSpeaker] = useState(null);
    const [eventsList, setEventsList] = useState([]);
    const [selectedEventId, setSelectedEventId] = useState('');
    const [bookingStartTime, setBookingStartTime] = useState('');
    const [bookingEndTime, setBookingEndTime] = useState('');

    // Admin mock ID
    const [adminId] = useState("admin_" + Math.floor(Math.random() * 10000));

    useEffect(() => {
        fetchSpeakers();
        socket.on('SESSION_DELETED', () => {
            fetchSpeakers();
        });
        socket.on('SPEAKER_SCHEDULED', () => {
            fetchSpeakers();
        });
        socket.on('SPEAKER_LOCKED', ({ speakerId, lockedBy }) => {
            setLockedSpeakers(prev => ({ ...prev, [speakerId]: lockedBy }));
        });
        socket.on('SPEAKER_UNLOCKED', ({ speakerId }) => {
            setLockedSpeakers(prev => {
                const next = { ...prev };
                delete next[speakerId];
                return next;
            });
        });

        return () => {
            socket.off('SPEAKER_SCHEDULED');
            socket.off('SPEAKER_LOCKED');
            socket.off('SPEAKER_UNLOCKED');
            socket.off('SESSION_DELETED');
        };
    }, []);

    const fetchSpeakers = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/speakers');
            setAllSpeakers(res.data);
            if (!isSearching) {
                setDisplaySpeakers(res.data);
            }
        } catch (error) {
            console.error("Error fetching speakers", error);
        }
    };

    const handleSearch = async () => {
        if (!topic.trim()) return;
        setIsSearching(true);
        try {
            const res = await axios.post('http://localhost:5000/api/speakers/suggest', {
                sessionTopic: topic,
                startTime: new Date().toISOString(),
                endTime: new Date(Date.now() + 3600000).toISOString()
            });
            // res.data is an array of { speaker, priority_score, reasoning }
            setDisplaySpeakers(res.data);
        } catch (error) {
            console.error("AI search error", error);
            setIsSearching(false);
        }
    };

    const clearSearch = () => {
        setIsSearching(false);
        setTopic('');
        setDisplaySpeakers(allSpeakers);
    };

    const handleCreateSpeaker = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:5000/api/speakers', {
                ...newSpeaker,
                expertise: newSpeaker.expertise.split(',').map(e => e.trim()),
                availability: newSpeaker.availability.split(',').map(a => a.trim())
            });
            setIsAddingSpeaker(false);
            setNewSpeaker({ name: '', email: '', bio: '', expertise: '', availability: '' });
            fetchSpeakers();
        } catch (error) {
            console.error("Error creating speaker", error);
        }
    };

    const openBookingModal = async (speaker) => {
        setBookingSpeaker(speaker);
        try {
            const res = await axios.get('http://localhost:5000/api/events');
            setEventsList(res.data);
            if (res.data.length > 0) setSelectedEventId(res.data[0].id.toString());
        } catch (error) {
            console.error("Error fetching events", error);
        }
    };

    const confirmBooking = async (id) => {
        if (!selectedEventId || !bookingStartTime || !bookingEndTime) {
            alert("Please select an event and specify start and end times.");
            return;
        }
        try {
            await axios.post(`http://localhost:5000/api/speakers/${id}/lock`, { 
                adminId, 
                eventId: selectedEventId,
                startTime: bookingStartTime,
                endTime: bookingEndTime
            });
            setBookingSpeaker(null);
            setBookingStartTime('');
            setBookingEndTime('');
            fetchSpeakers();
        } catch (error) {
            alert(error.response?.data?.error || "Error locking speaker");
        }
    };
    
    const cancelSession = async (sessionId) => {
        if (!window.confirm("Are you sure you want to cancel this booking?")) return;
        try {
            await axios.delete(`http://localhost:5000/api/sessions/${sessionId}`);
            fetchSpeakers();
        } catch (error) {
            alert(error.response?.data?.error || "Error cancelling booking");
        }
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">

            {/* Booking Modal */}
            {bookingSpeaker && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-card glass max-w-md w-full rounded-2xl p-6 relative border border-border shadow-2xl">
                        <button 
                            onClick={() => setBookingSpeaker(null)}
                            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
                        >
                            <X size={18} />
                        </button>
                        
                        <h2 className="text-2xl font-bold mb-4">Book {bookingSpeaker.name}</h2>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Select Event</label>
                                <select 
                                    className="input w-full"
                                    value={selectedEventId}
                                    onChange={e => setSelectedEventId(e.target.value)}
                                >
                                    {eventsList.map(event => (
                                        <option key={event.id} value={event.id}>{event.title}</option>
                                    ))}
                                </select>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium mb-1">Start Time</label>
                                <input 
                                    type="datetime-local" 
                                    className="input w-full"
                                    value={bookingStartTime}
                                    onChange={e => setBookingStartTime(e.target.value)}
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium mb-1">End Time</label>
                                <input 
                                    type="datetime-local" 
                                    className="input w-full"
                                    value={bookingEndTime}
                                    onChange={e => setBookingEndTime(e.target.value)}
                                />
                            </div>
                            
                            <div className="flex justify-end gap-3 mt-6">
                                <button onClick={() => setBookingSpeaker(null)} className="btn btn-secondary">
                                    Cancel
                                </button>
                                <button onClick={() => confirmBooking(bookingSpeaker.id)} className="btn btn-primary flex items-center gap-2">
                                    <Lock size={16} /> Confirm Booking
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold gradient-text">Speaker Management</h2>
                <button 
                    onClick={() => setIsAddingSpeaker(!isAddingSpeaker)} 
                    className="btn btn-primary flex items-center"
                >
                    {isAddingSpeaker ? <X size={18} className="mr-2"/> : <Plus size={18} className="mr-2"/>}
                    {isAddingSpeaker ? 'Cancel' : 'Add Speaker'}
                </button>
            </div>
            
            {/* Add Speaker Form */}
            {isAddingSpeaker && (
                <div className="card space-y-4 border border-primary">
                    <h3 className="text-xl font-semibold">Add New Speaker</h3>
                    <form onSubmit={handleCreateSpeaker} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input type="text" placeholder="Speaker Name" required className="input" value={newSpeaker.name} onChange={e => setNewSpeaker({...newSpeaker, name: e.target.value})} />
                        <input type="email" placeholder="Email" required className="input" value={newSpeaker.email} onChange={e => setNewSpeaker({...newSpeaker, email: e.target.value})} />
                        <input type="text" placeholder="Bio" className="input md:col-span-2" value={newSpeaker.bio} onChange={e => setNewSpeaker({...newSpeaker, bio: e.target.value})} />
                        <input type="text" placeholder="Expertise (comma separated)" className="input" value={newSpeaker.expertise} onChange={e => setNewSpeaker({...newSpeaker, expertise: e.target.value})} />
                        <input type="text" placeholder="Availability Slots (e.g. 10:00-11:00)" className="input" value={newSpeaker.availability} onChange={e => setNewSpeaker({...newSpeaker, availability: e.target.value})} />
                        <div className="md:col-span-2 flex justify-end">
                            <button type="submit" className="btn btn-primary">Save Speaker</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Integrated Search Bar */}
            <div className="card">
                <h3 className="text-xl font-semibold mb-4">Search & Prioritize Speakers</h3>
                <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
                    <input 
                        type="text" 
                        value={topic} 
                        onChange={(e) => setTopic(e.target.value)} 
                        className="input flex-1" 
                        placeholder="Search by event topic, expertise, or required background..."
                    />
                    <div className="flex space-x-2">
                        <button onClick={handleSearch} className="btn btn-primary flex items-center">
                            <Search size={18} className="mr-2"/> Search
                        </button>
                        {isSearching && (
                            <button onClick={clearSearch} className="btn btn-secondary flex items-center">
                                <XCircle size={18} className="mr-2"/> Clear
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Results Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {displaySpeakers.map((item, index) => {
                    const speaker = item.speaker || item;
                    const isLockedByMe = lockedSpeakers[speaker.id] === adminId;
                    const isLockedByOther = lockedSpeakers[speaker.id] && lockedSpeakers[speaker.id] !== adminId;

                    return (
                        <div key={speaker.id} className={`card relative overflow-hidden ${isLockedByMe ? 'ring-2 ring-primary' : ''} ${isSearching && index === 0 ? 'bg-primary/5 dark:bg-primary/10 border-primary/50' : ''}`}>
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    {isSearching && (
                                        <span className="text-xs font-bold text-primary mb-1 block">#{index + 1} Priority Match (Score: {item.priority_score})</span>
                                    )}
                                    <h3 className="text-xl font-bold">{speaker.name}</h3>
                                </div>
                                {isLockedByOther && (
                                    <span className="flex items-center text-xs bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 px-2 py-1 rounded mt-1">
                                        <Lock size={12} className="mr-1" /> Locked
                                    </span>
                                )}
                            </div>
                            
                            <p className="text-muted-foreground mt-2">{speaker.bio}</p>
                            
                            <div className="flex justify-between items-center mt-3 mb-4">
                                <p className="text-sm"><span className="font-semibold text-foreground">Expertise:</span> {speaker.expertise}</p>
                                {speaker.pastRating && (
                                    <span className="text-sm bg-secondary text-secondary-foreground px-2 py-1 rounded">Rating: ⭐{speaker.pastRating}</span>
                                )}
                            </div>
                            
                            {isSearching && item.reasoning && (
                                <div className="mb-4 p-3 bg-secondary rounded text-sm text-secondary-foreground">
                                    {item.reasoning}
                                </div>
                            )}

                            {speaker.sessions && speaker.sessions.length > 0 && (
                                <div className="mb-4">
                                    <h4 className="text-sm font-semibold mb-2">Current Bookings:</h4>
                                    <ul className="space-y-2">
                                        {speaker.sessions.map(session => (
                                            <li key={session.id} className="text-xs bg-primary/10 p-2 rounded flex justify-between items-center border border-primary/20">
                                                <div>
                                                    <div className="font-semibold text-primary">{session.event?.title || 'Event'}</div>
                                                    <div className="text-muted-foreground">
                                                        {new Date(session.startTime).toLocaleString()} - {new Date(session.endTime).toLocaleTimeString()}
                                                    </div>
                                                </div>
                                                <button 
                                                    onClick={() => cancelSession(session.id)}
                                                    className="text-red-500 hover:text-red-700 ml-2"
                                                    title="Cancel Booking"
                                                >
                                                    <XCircle size={16} />
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            
                            <div className="pt-4 border-t border-border flex justify-end">
                                <button 
                                    onClick={() => openBookingModal(speaker)} 
                                    disabled={isLockedByOther}
                                    className="btn btn-primary flex items-center text-sm py-1 px-3 disabled:opacity-50"
                                >
                                    <Lock size={14} className="mr-1" /> Book Speaker
                                </button>
                            </div>
                        </div>
                    );
                })}
                
                {displaySpeakers.length === 0 && (
                    <div className="col-span-full text-center py-12 text-muted-foreground">
                        No speakers found matching your criteria.
                    </div>
                )}
            </div>
        </motion.div>
    );
}
