import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { io } from 'socket.io-client';
import { Plus, Search, Lock, Unlock, X, XCircle } from 'lucide-react';

const socket = io('http://localhost:5000');

export default function VenueManagement() {
    const [allVenues, setAllVenues] = useState([]);
    const [displayVenues, setDisplayVenues] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [reqs, setReqs] = useState({ capacity: '' });
    
    // Locks state
    const [lockedVenues, setLockedVenues] = useState({});
    
    // Add form state
    const [isAddingVenue, setIsAddingVenue] = useState(false);
    const [newVenue, setNewVenue] = useState({ name: '', capacity: '', location: '', facilities: '', status: 'AVAILABLE' });
    
    // Booking modal state
    const [bookingVenue, setBookingVenue] = useState(null);
    const [eventsList, setEventsList] = useState([]);
    const [selectedEventId, setSelectedEventId] = useState('');
    const [bookingStartTime, setBookingStartTime] = useState('');
    const [bookingEndTime, setBookingEndTime] = useState('');
    
    // Admin mock ID
    const [adminId] = useState("admin_" + Math.floor(Math.random() * 10000));

    useEffect(() => {
        fetchVenues();
        socket.on('SESSION_DELETED', () => {
            fetchVenues();
        });
        socket.on('VENUE_UPDATED', (updatedVenue) => {
            // We should ideally fetch everything again to get deep relations like sessions, or we can just fetchVenues
            fetchVenues();
        });
        socket.on('VENUE_BOOKED', () => {
            fetchVenues();
        });
        socket.on('VENUE_LOCKED', ({ venueId, lockedBy }) => {
            setLockedVenues(prev => ({ ...prev, [venueId]: lockedBy }));
        });
        socket.on('VENUE_UNLOCKED', ({ venueId }) => {
            setLockedVenues(prev => {
                const next = { ...prev };
                delete next[venueId];
                return next;
            });
        });
        
        return () => {
            socket.off('VENUE_UPDATED');
            socket.off('VENUE_LOCKED');
            socket.off('VENUE_UNLOCKED');
            socket.off('SESSION_DELETED');
            socket.off('VENUE_BOOKED');
        };
    }, []);

    const fetchVenues = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/venues');
            setAllVenues(res.data);
            if (!isSearching) {
                setDisplayVenues(res.data);
            }
        } catch (error) {
            console.error("Error fetching venues", error);
        }
    };

    const handleSearch = async () => {
        if (!reqs.capacity) return;
        setIsSearching(true);
        try {
            const res = await axios.post('http://localhost:5000/api/venues/suggest', {
                eventRequirements: reqs
            });
            // res.data is an array of { venue, priority_score, reasoning }
            setDisplayVenues(res.data);
        } catch (error) {
            console.error("AI search error", error);
            setIsSearching(false);
        }
    };

    const clearSearch = () => {
        setIsSearching(false);
        setReqs({ capacity: '' });
        setDisplayVenues(allVenues);
    };

    const handleCreateVenue = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:5000/api/venues', {
                ...newVenue,
                facilities: newVenue.facilities.split(',').map(f => f.trim())
            });
            setIsAddingVenue(false);
            setNewVenue({ name: '', capacity: '', location: '', facilities: '', status: 'AVAILABLE' });
            fetchVenues();
        } catch (error) {
            console.error("Error creating venue", error);
        }
    };

    const openBookingModal = async (venue) => {
        setBookingVenue(venue);
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
            await axios.post(`http://localhost:5000/api/venues/${id}/lock`, { 
                adminId, 
                eventId: selectedEventId,
                startTime: bookingStartTime,
                endTime: bookingEndTime
            });
            setBookingVenue(null);
            setBookingStartTime('');
            setBookingEndTime('');
            // Optional: call fetchVenues here just in case socket is slow
            fetchVenues();
        } catch (error) {
            alert(error.response?.data?.error || "Error locking venue");
        }
    };
    
    const cancelSession = async (sessionId) => {
        if (!window.confirm("Are you sure you want to cancel this booking?")) return;
        try {
            await axios.delete(`http://localhost:5000/api/sessions/${sessionId}`);
            fetchVenues();
        } catch (error) {
            alert(error.response?.data?.error || "Error cancelling booking");
        }
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            
            {/* Booking Modal */}
            {bookingVenue && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-card glass max-w-md w-full rounded-2xl p-6 relative border border-border shadow-2xl">
                        <button 
                            onClick={() => setBookingVenue(null)}
                            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
                        >
                            <X size={18} />
                        </button>
                        
                        <h2 className="text-2xl font-bold mb-4">Book {bookingVenue.name}</h2>
                        
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
                                <button onClick={() => setBookingVenue(null)} className="btn btn-secondary">
                                    Cancel
                                </button>
                                <button onClick={() => confirmBooking(bookingVenue.id)} className="btn btn-primary flex items-center gap-2">
                                    <Lock size={16} /> Confirm Booking
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold gradient-text">Venue Management</h2>
                <button 
                    onClick={() => setIsAddingVenue(!isAddingVenue)} 
                    className="btn btn-primary flex items-center"
                >
                    {isAddingVenue ? <X size={18} className="mr-2"/> : <Plus size={18} className="mr-2"/>}
                    {isAddingVenue ? 'Cancel' : 'Add Venue'}
                </button>
            </div>
            
            {/* Add Venue Form */}
            {isAddingVenue && (
                <div className="card space-y-4 border border-primary">
                    <h3 className="text-xl font-semibold">Add New Venue</h3>
                    <form onSubmit={handleCreateVenue} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input type="text" placeholder="Venue Name" required className="input" value={newVenue.name} onChange={e => setNewVenue({...newVenue, name: e.target.value})} />
                        <input type="number" placeholder="Capacity" required className="input" value={newVenue.capacity} onChange={e => setNewVenue({...newVenue, capacity: e.target.value})} />
                        <input type="text" placeholder="Location" required className="input" value={newVenue.location} onChange={e => setNewVenue({...newVenue, location: e.target.value})} />
                        <input type="text" placeholder="Facilities (comma separated)" className="input" value={newVenue.facilities} onChange={e => setNewVenue({...newVenue, facilities: e.target.value})} />
                        <div className="md:col-span-2 flex justify-end">
                            <button type="submit" className="btn btn-primary">Save Venue</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Integrated Search Bar */}
            <div className="card">
                <h3 className="text-xl font-semibold mb-4">Search & Prioritize Venues</h3>
                <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
                    <input 
                        type="number" 
                        value={reqs.capacity} 
                        onChange={(e) => setReqs({ capacity: e.target.value })} 
                        className="input flex-1" 
                        placeholder="Filter by required attendees/capacity..."
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayVenues.map((item, index) => {
                    const venue = item.venue || item;
                    const isLockedByMe = lockedVenues[venue.id] === adminId;
                    const isLockedByOther = lockedVenues[venue.id] && lockedVenues[venue.id] !== adminId;

                    return (
                        <div key={venue.id} className={`card relative overflow-hidden ${isLockedByMe ? 'ring-2 ring-primary' : ''} ${isSearching && index === 0 ? 'bg-green-50 dark:bg-green-900/20 border-green-500/50' : ''}`}>
                            <div className={`absolute top-0 left-0 w-1 h-full ${venue.status === 'AVAILABLE' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                            
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    {isSearching && (
                                        <span className="text-xs font-bold text-primary mb-1 block">#{index + 1} Priority Match (Score: {item.priority_score})</span>
                                    )}
                                    <h3 className="text-xl font-bold">{venue.name}</h3>
                                </div>
                                {isLockedByOther && (
                                    <span className="flex items-center text-xs bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 px-2 py-1 rounded mt-1">
                                        <Lock size={12} className="mr-1" /> Locked
                                    </span>
                                )}
                            </div>
                            
                            <p className="text-muted-foreground mb-1">Capacity: <span className="font-semibold text-foreground">{venue.capacity}</span> attendees</p>
                            <p className="text-muted-foreground mb-4">Status: <span className={venue.status === 'AVAILABLE' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>{venue.status}</span></p>
                            
                            {isSearching && item.reasoning && (
                                <div className="mb-4 p-3 bg-secondary rounded text-sm text-secondary-foreground">
                                    {item.reasoning}
                                </div>
                            )}

                            {venue.sessions && venue.sessions.length > 0 && (
                                <div className="mb-4">
                                    <h4 className="text-sm font-semibold mb-2">Current Bookings:</h4>
                                    <ul className="space-y-2">
                                        {venue.sessions.map(session => (
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
                                    onClick={() => openBookingModal(venue)} 
                                    disabled={isLockedByOther || venue.status !== 'AVAILABLE'}
                                    className="btn btn-primary flex items-center text-sm py-1 px-3 disabled:opacity-50"
                                >
                                    <Lock size={14} className="mr-1" /> Book Venue
                                </button>
                            </div>
                        </div>
                    );
                })}
                
                {displayVenues.length === 0 && (
                    <div className="col-span-full text-center py-12 text-muted-foreground">
                        No venues found matching your criteria.
                    </div>
                )}
            </div>
        </motion.div>
    );
}
