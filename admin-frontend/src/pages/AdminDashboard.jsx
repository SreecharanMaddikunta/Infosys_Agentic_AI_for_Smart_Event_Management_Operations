import { useState, useEffect } from 'react';
import axios from 'axios';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import ScannerModal from '../components/ScannerModal';
import ConflictResolution from '../components/ConflictResolution';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { motion } from 'framer-motion';

export default function AdminDashboard() {
    const [events, setEvents] = useState([]);
    const [newEvent, setNewEvent] = useState({ title: '', description: '', date: '', venue: '', slots: '' });
    const [stats, setStats] = useState({ totalReg: 0, aiPredicted: 0, duplicatesPrevented: 0, categoryStats: {}, genderStats: {} });
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [selectedEventForBreakdown, setSelectedEventForBreakdown] = useState(null);
    const [vipAlert, setVipAlert] = useState(null);

    // Mock data for AI Analytics chart (could also be fetched if backend provided time-series data)
    const analyticsData = [
        { time: '10 AM', registrations: 12, predicted: 15 },
        { time: '12 PM', registrations: 45, predicted: 40 },
        { time: '2 PM', registrations: 120, predicted: 110 },
        { time: '4 PM', registrations: 340, predicted: 350 },
        { time: '6 PM', registrations: 512, predicted: 500 },
        { time: '8 PM', registrations: 890, predicted: 870 },
    ];
    const categoryData = Object.entries(stats.categoryStats || {}).map(([name, value]) => ({ name, value }));
    const genderData = Object.entries(stats.genderStats || {}).map(([name, value]) => ({ name, value }));
    const COLORS = ['#8b5cf6', '#ec4899', '#3b82f6', '#10b981', '#f59e0b'];

    useEffect(() => {
        fetchEvents();
        fetchStats();
        
        // Setup VIP Arrival Socket
        const socket = io('http://localhost:5000');
        socket.on('vip_arrival', (data) => {
            setVipAlert(data);
            setTimeout(() => setVipAlert(null), 15000); // Hide after 15s
        });

        return () => {
            socket.disconnect();
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

    const fetchStats = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/admin/stats', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStats(res.data);
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

    const handleDeleteEvent = async (id) => {
        if(!window.confirm("Are you sure you want to delete this event? All registrations will be wiped.")) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`http://localhost:5000/api/events/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchEvents();
        } catch (err) {
            console.error(err);
        }
    };

    const handleExportPDF = async (eventId, eventTitle) => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`http://localhost:5000/api/admin/events/${eventId}/attendees`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const attendees = res.data;
            
            const doc = new jsPDF('landscape');
            doc.setFontSize(18);
            doc.text(`Attendee List: ${eventTitle}`, 14, 22);
            
            const formatTime = (isoString) => {
                if (!isoString) return '-';
                return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            };

            const tableData = attendees.map(a => [
                a.student?.name || 'Unknown',
                a.student?.category || 'Student',
                a.student?.gender || 'N/A',
                a.student?.email || 'N/A',
                a.student?.phone || 'N/A',
                a.student?.college || 'N/A',
                a.registrationId,
                a.status,
                formatTime(a.attendance?.checkInTime),
                formatTime(a.attendance?.checkOutTime),
                a.attendance?.durationMinutes ? `${a.attendance.durationMinutes} min` : '-'
            ]);
            
            autoTable(doc, {
                startY: 30,
                head: [['Name', 'Category', 'Gender', 'Email', 'Phone', 'Org', 'Ticket', 'Status', 'Check-in', 'Check-out', 'Duration']],
                body: tableData,
                styles: { fontSize: 8 },
                headStyles: { fillColor: [79, 70, 229] }
            });
            
            doc.save(`Attendees_${eventTitle.replace(/\s+/g, '_')}.pdf`);
        } catch (err) {
            console.error(err);
            alert(`Failed to export PDF: ${err.message || 'Check console for details'}`);
        }
    };

    return (
        <div className="space-y-8 relative">
            {/* VIP Alert Toast */}
            {vipAlert && (
                <motion.div 
                    initial={{ opacity: 0, y: -50, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="fixed top-8 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-amber-500 to-orange-500 text-white p-6 rounded-2xl shadow-2xl shadow-orange-500/30 flex items-center gap-6 min-w-[400px] border border-orange-400/50"
                >
                    <div className="text-4xl">👑</div>
                    <div className="flex-1">
                        <h3 className="font-bold text-xl mb-1 text-white">{vipAlert.category} Arrival!</h3>
                        <p className="text-white/90 font-medium">{vipAlert.name} has just checked into <b>{vipAlert.eventTitle}</b>.</p>
                        <p className="text-xs text-white/70 mt-2">Time: {new Date(vipAlert.time).toLocaleTimeString()}</p>
                    </div>
                    <button onClick={() => setVipAlert(null)} className="text-white/80 hover:text-white text-xl">✕</button>
                </motion.div>
            )}

            <ScannerModal isOpen={isScannerOpen} onClose={() => setIsScannerOpen(false)} />
            
            {/* Breakdown Modal */}
            {selectedEventForBreakdown && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-card glass max-w-4xl w-full rounded-2xl p-6 relative border border-border shadow-2xl overflow-y-auto max-h-[90vh]">
                        <button 
                            onClick={() => setSelectedEventForBreakdown(null)}
                            className="absolute top-4 right-4 text-muted-foreground hover:text-white"
                        >
                            ✕
                        </button>
                        
                        <h2 className="text-3xl font-bold mb-2">Event Breakdown: {selectedEventForBreakdown.title}</h2>
                        <div className="flex gap-4 mb-8 text-sm text-muted-foreground">
                            <span>Total Registrations: <b className="text-foreground">{selectedEventForBreakdown.totalRegistrations}</b></span>
                            <span>Approved/Completed: <b className="text-primary">{selectedEventForBreakdown.approvedRegistrations}</b></span>
                            <span>Total Slots: <b className="text-foreground">{selectedEventForBreakdown.slots}</b></span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="bg-secondary p-6 rounded-2xl h-80 flex flex-col border border-border">
                                <h3 className="text-xl font-semibold mb-2 text-primary text-center">By Category</h3>
                                <div className="flex-1 min-h-0">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie 
                                                data={Object.entries(selectedEventForBreakdown.categoryStats || {}).map(([name, value]) => ({ name, value }))} 
                                                dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label
                                            >
                                                {Object.entries(selectedEventForBreakdown.categoryStats || {}).map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                            </Pie>
                                            <Tooltip contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff' }} />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                            
                            <div className="bg-secondary p-6 rounded-2xl h-80 flex flex-col border border-border">
                                <h3 className="text-xl font-semibold mb-2 text-accent text-center">By Gender</h3>
                                <div className="flex-1 min-h-0">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie 
                                                data={Object.entries(selectedEventForBreakdown.genderStats || {}).map(([name, value]) => ({ name, value }))} 
                                                dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label
                                            >
                                                {Object.entries(selectedEventForBreakdown.genderStats || {}).map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                            </Pie>
                                            <Tooltip contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff' }} />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            <div className="flex justify-between items-center">
                <h2 className="text-4xl font-bold">Admin Dashboard</h2>
                <div className="flex items-center gap-6">
                    <button 
                        onClick={() => setIsScannerOpen(true)}
                        className="btn btn-primary shadow-lg hover:scale-105 transition flex items-center gap-2"
                    >
                        📸 Scan Tickets
                    </button>
                    <div className="glass px-4 py-2 rounded-lg text-sm text-muted-foreground flex gap-4">
                        <span>Total Reg: <b className="text-foreground">{stats.totalReg}</b></span>
                        <span>AI Predicted: <b className="text-primary">{stats.aiPredicted}</b></span>
                        <span>Duplicates Prevented: <b className="text-green-600 dark:text-green-400">{stats.duplicatesPrevented}</b></span>
                    </div>
                </div>
            </div>
            
            <ConflictResolution onUpdate={fetchStats} />
            
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8 mb-8">
                <div className="glass p-6 rounded-2xl h-80 flex flex-col">
                    <h3 className="text-xl font-semibold mb-2 text-primary">Registrations by Category</h3>
                    <div className="flex-1 min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                                    {categoryData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff' }} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                
                <div className="glass p-6 rounded-2xl h-80 flex flex-col">
                    <h3 className="text-xl font-semibold mb-2 text-accent">Registrations by Gender</h3>
                    <div className="flex-1 min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={genderData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                                    {genderData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff' }} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="glass p-6 rounded-2xl">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-semibold flex items-center gap-2">
                        <span>📊</span> Manage Events & Registrations
                    </h3>
                    <div className="flex gap-2">
                        <input type="text" placeholder="Search events..." className="bg-input rounded-lg px-3 py-1 text-sm focus:outline-none focus:border-primary border border-border" />
                        <button className="bg-muted px-3 py-1 rounded-lg text-sm hover:bg-muted/80">Filter</button>
                    </div>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-border/50 text-muted-foreground text-sm uppercase tracking-wider">
                                <th className="pb-3 pr-4 font-medium">Event Name</th>
                                <th className="pb-3 px-4 font-medium">Date & Time</th>
                                <th className="pb-3 px-4 font-medium">Venue</th>
                                <th className="pb-3 px-4 font-medium">Capacity</th>
                                <th className="pb-3 pl-4 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {events.map((event) => (
                                <tr key={event.id} className="border-b border-border/30 hover:bg-white/5 transition-colors group">
                                    <td className="py-4 pr-4">
                                        <div className="font-bold text-foreground">{event.title}</div>
                                        <div className="text-xs text-muted-foreground line-clamp-1">{event.description}</div>
                                    </td>
                                    <td className="py-4 px-4 text-sm">{new Date(event.date).toLocaleString()}</td>
                                    <td className="py-4 px-4 text-sm">{event.venue}</td>
                                    <td className="py-4 px-4">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-sm font-semibold">{event.approvedRegistrations || 0} / {event.slots}</span>
                                            <span className="text-xs text-muted-foreground">approved</span>
                                        </div>
                                        <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                                            <div className="h-full bg-primary" style={{ width: `${Math.min(((event.approvedRegistrations || 0) / event.slots) * 100, 100)}%` }}></div>
                                        </div>
                                    </td>
                                    <td className="py-4 pl-4 text-right flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button 
                                            onClick={() => setSelectedEventForBreakdown(event)}
                                            className="text-xs font-semibold text-white bg-purple-500/20 border border-purple-500/50 hover:bg-purple-500 px-3 py-1.5 rounded-lg transition-all"
                                        >
                                            Breakdown
                                        </button>
                                        <button 
                                            onClick={() => handleExportPDF(event.id, event.title)}
                                            className="text-xs font-semibold text-white bg-blue-500/20 border border-blue-500/50 hover:bg-blue-500 px-3 py-1.5 rounded-lg transition-all"
                                        >
                                            Export PDF
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteEvent(event.id)}
                                            className="text-xs font-semibold text-white bg-red-500/20 border border-red-500/50 hover:bg-red-500 px-3 py-1.5 rounded-lg transition-all"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
