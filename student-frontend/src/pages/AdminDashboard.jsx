import { useState, useEffect } from 'react';
import axios from 'axios';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AdminDashboard() {
    const [events, setEvents] = useState([]);
    const [newEvent, setNewEvent] = useState({ title: '', description: '', date: '', venue: '', slots: '' });

    // Mock data for AI Analytics chart
    const analyticsData = [
        { time: '10 AM', registrations: 12, predicted: 15 },
        { time: '12 PM', registrations: 45, predicted: 40 },
        { time: '2 PM', registrations: 120, predicted: 110 },
        { time: '4 PM', registrations: 340, predicted: 350 },
        { time: '6 PM', registrations: 512, predicted: 500 },
        { time: '8 PM', registrations: 890, predicted: 870 },
    ];

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/events');
            setEvents(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleCreateEvent = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:5000/api/events', {
                ...newEvent, slots: parseInt(newEvent.slots)
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchEvents();
            setNewEvent({ title: '', description: '', date: '', venue: '', slots: '' });
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h2 className="text-4xl font-bold">Admin Dashboard</h2>
                <div className="glass px-4 py-2 rounded-lg text-sm text-muted-foreground flex gap-4">
                    <span>Total Reg: <b className="text-white">890</b></span>
                    <span>AI Predicted: <b className="text-primary">870</b></span>
                    <span>Duplicates Prevented: <b className="text-green-400">12</b></span>
                </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 glass p-6 rounded-2xl h-96">
                    <h3 className="text-xl font-semibold mb-4 text-primary">AI Registration Trends</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={analyticsData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorReg" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="time" stroke="#666" />
                            <YAxis stroke="#666" />
                            <Tooltip contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff' }} />
                            <Area type="monotone" dataKey="registrations" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorReg)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
                
                <div className="glass p-6 rounded-2xl">
                    <h3 className="text-xl font-semibold mb-4 text-accent">Create Event</h3>
                    <form onSubmit={handleCreateEvent} className="space-y-3">
                        <input type="text" placeholder="Title" className="w-full bg-input rounded-lg px-3 py-2 text-sm focus:border-primary focus:outline-none" value={newEvent.title} onChange={e=>setNewEvent({...newEvent, title: e.target.value})} required/>
                        <input type="text" placeholder="Description" className="w-full bg-input rounded-lg px-3 py-2 text-sm focus:border-primary focus:outline-none" value={newEvent.description} onChange={e=>setNewEvent({...newEvent, description: e.target.value})}/>
                        <input type="datetime-local" className="w-full bg-input rounded-lg px-3 py-2 text-sm focus:border-primary focus:outline-none" value={newEvent.date} onChange={e=>setNewEvent({...newEvent, date: e.target.value})} required/>
                        <input type="text" placeholder="Venue" className="w-full bg-input rounded-lg px-3 py-2 text-sm focus:border-primary focus:outline-none" value={newEvent.venue} onChange={e=>setNewEvent({...newEvent, venue: e.target.value})} required/>
                        <input type="number" placeholder="Slots" className="w-full bg-input rounded-lg px-3 py-2 text-sm focus:border-primary focus:outline-none" value={newEvent.slots} onChange={e=>setNewEvent({...newEvent, slots: e.target.value})} required/>
                        <button type="submit" className="w-full bg-primary text-white rounded-lg py-2 font-bold shadow-lg shadow-primary/20 hover:bg-primary/90">Publish Event</button>
                    </form>
                </div>
            </div>

            <div className="glass p-6 rounded-2xl">
                <h3 className="text-xl font-semibold mb-4">Manage Events</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {events.map(event => (
                        <div key={event.id} className="bg-input/50 p-4 rounded-xl border border-border">
                            <h4 className="font-bold">{event.title}</h4>
                            <p className="text-xs text-muted-foreground mt-1">{new Date(event.date).toLocaleString()} | {event.venue}</p>
                            <div className="mt-4 flex justify-between items-center">
                                <span className="text-xs font-semibold bg-primary/20 text-primary px-2 py-1 rounded">Slots: {event.slots}</span>
                                <button className="text-xs text-blue-400 hover:underline">View Attendees</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
