import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import io from 'socket.io-client';
import { 
    AreaChart, Area, 
    BarChart, Bar, 
    PieChart, Pie, Cell, 
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

const COLORS = ['#4f46e5', '#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b', '#ef4444'];
const socket = io('http://localhost:5000');

export default function AnalyticsDashboard() {
    const [loading, setLoading] = useState(true);
    const [activeModal, setActiveModal] = useState(null); // 'events', 'users', 'registrations', 'sessions'
    
    const [analytics, setAnalytics] = useState({
        overview: { 
            totalEvents: 0, totalUsers: 0, totalRegistrations: 0, activeSessions: 0,
            eventsList: [], usersList: [], registrationsList: [], sessionsList: []
        },
        registrationTrends: [],
        demographics: { categories: [], genders: [] },
        venueUtilization: [],
        speakerStats: []
    });

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const res = await axios.get('http://localhost:5000/api/analytics');
                setAnalytics(res.data);
            } catch (error) {
                console.error("Error fetching analytics", error);
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
        
        // Listen for real-time ecosystem events to update charts instantly
        socket.on('sponsor_added', fetchAnalytics);
        socket.on('sponsorship_updated', fetchAnalytics);
        socket.on('registration_created', fetchAnalytics);
        socket.on('event_created', fetchAnalytics);
        socket.on('event_updated', fetchAnalytics);
        socket.on('event_deleted', fetchAnalytics);
        
        return () => {
            socket.off('sponsor_added');
            socket.off('sponsorship_updated');
            socket.off('registration_created');
            socket.off('event_created');
            socket.off('event_updated');
            socket.off('event_deleted');
        };
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary"></div>
            </div>
        );
    }

    const { overview, registrationTrends, demographics, venueUtilization, speakerStats } = analytics;

    // Helper to render the content of the active modal
    const renderModalContent = () => {
        if (!activeModal) return null;

        let title = '';
        let list = [];
        let renderItem = () => {};

        switch(activeModal) {
            case 'events':
                title = 'All Events';
                list = overview.eventsList || [];
                renderItem = (e) => (
                    <div key={e.id} className="bg-secondary/30 p-3 rounded-lg mb-2 flex justify-between items-center">
                        <span className="font-bold">{e.title}</span>
                        <span className="text-sm text-muted-foreground">{new Date(e.date).toDateString()} - {e.venue}</span>
                    </div>
                );
                break;
            case 'users':
                title = 'Total Users (Students)';
                list = overview.usersList || [];
                renderItem = (u) => (
                    <div key={u.id} className="bg-secondary/30 p-3 rounded-lg mb-2 flex justify-between items-center">
                        <div>
                            <div className="font-bold">{u.name}</div>
                            <div className="text-xs text-muted-foreground">{u.email}</div>
                        </div>
                        <span className="text-sm px-2 py-1 rounded bg-primary/20 text-primary">{u.category || 'Student'}</span>
                    </div>
                );
                break;
            case 'registrations':
                title = 'All Registrations';
                list = overview.registrationsList || [];
                renderItem = (r) => (
                    <div key={r.id} className="bg-secondary/30 p-3 rounded-lg mb-2 flex justify-between items-center">
                        <div>
                            <div className="font-bold">{r.student?.name}</div>
                            <div className="text-xs text-muted-foreground">Event: {r.event?.title}</div>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded font-bold ${
                            r.status === 'APPROVED' ? 'bg-green-500/20 text-green-500' : 
                            r.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-red-500/20 text-red-500'
                        }`}>{r.status}</span>
                    </div>
                );
                break;
            case 'sessions':
                title = 'Active Sessions';
                list = overview.sessionsList || [];
                renderItem = (s) => (
                    <div key={s.id} className="bg-secondary/30 p-3 rounded-lg mb-2 flex justify-between items-center">
                        <div>
                            <div className="font-bold text-primary">{s.title || 'Session'}</div>
                            <div className="text-xs text-muted-foreground">For Event: {s.event?.title}</div>
                        </div>
                        <div className="text-xs text-right">
                            {s.speaker && <div className="text-accent">🗣️ {s.speaker.name}</div>}
                            {s.venue && <div className="text-emerald-400">📍 {s.venue.name}</div>}
                            <div className="text-muted-foreground mt-1">{new Date(s.startTime).toLocaleTimeString()}</div>
                        </div>
                    </div>
                );
                break;
            default: return null;
        }

        return (
            <motion.div 
                initial={{ opacity: 0, scale: 0.9 }} 
                animate={{ opacity: 1, scale: 1 }} 
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-card p-6 rounded-2xl border border-white/10 shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-bold">{title} <span className="text-primary">({list.length})</span></h3>
                    <button onClick={() => setActiveModal(null)} className="text-muted-foreground hover:text-white transition text-2xl">&times;</button>
                </div>
                <div className="flex-1 overflow-y-auto pr-2 space-y-1">
                    {list.length > 0 ? list.map(renderItem) : <div className="text-center text-muted-foreground py-10">No records found.</div>}
                </div>
            </motion.div>
        );
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 relative">
            <h2 className="text-4xl font-bold gradient-text pb-2">Platform Analytics</h2>
            
            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Total Events', value: overview.totalEvents, icon: '📅', color: 'text-blue-500', type: 'events' },
                    { label: 'Total Users', value: overview.totalUsers, icon: '👥', color: 'text-purple-500', type: 'users' },
                    { label: 'Total Registrations', value: overview.totalRegistrations, icon: '🎫', color: 'text-green-500', type: 'registrations' },
                    { label: 'Active Sessions', value: overview.activeSessions, icon: '🕒', color: 'text-orange-500', type: 'sessions' },
                ].map((stat, idx) => (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        key={idx} 
                        onClick={() => setActiveModal(stat.type)}
                        className="glass p-6 rounded-2xl flex items-center justify-between shadow-lg cursor-pointer hover:border-primary/50 transition-colors"
                    >
                        <div>
                            <p className="text-sm font-semibold text-muted-foreground">{stat.label}</p>
                            <h3 className="text-4xl font-black mt-2 text-foreground">{stat.value}</h3>
                        </div>
                        <div className={`text-5xl ${stat.color} opacity-80`}>{stat.icon}</div>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Registration Trends */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="glass p-6 rounded-2xl shadow-xl h-96 flex flex-col"
                >
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><span>📈</span> Registration Trends</h3>
                    <div className="flex-1 w-full min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={registrationTrends} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorRegs" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="colorCap" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ec4899" stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#444" vertical={false} />
                                <XAxis dataKey="name" stroke="#888" tick={{fontSize: 12}} />
                                <YAxis stroke="#888" />
                                <Tooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid #333', borderRadius: '8px', color: '#fff' }} />
                                <Legend />
                                <Area type="monotone" dataKey="registrations" stroke="#4f46e5" fillOpacity={1} fill="url(#colorRegs)" name="Registrations" />
                                <Area type="monotone" dataKey="capacity" stroke="#ec4899" fillOpacity={1} fill="url(#colorCap)" name="Total Capacity" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Attendee Demographics */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className="glass p-6 rounded-2xl shadow-xl h-96 flex flex-col"
                >
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><span>👥</span> Attendee Demographics</h3>
                    <div className="flex-1 w-full min-h-0 flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={demographics.categories}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                >
                                    {demographics.categories.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid #333', borderRadius: '8px', color: '#fff' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Venue Utilization */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                    className="glass p-6 rounded-2xl shadow-xl h-96 flex flex-col"
                >
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><span>🏢</span> Venue Utilization</h3>
                    <div className="flex-1 w-full min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={venueUtilization} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#444" horizontal={false} />
                                <XAxis type="number" stroke="#888" domain={[0, 100]} />
                                <YAxis dataKey="name" type="category" stroke="#888" width={100} tick={{fontSize: 12}} />
                                <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid #333', borderRadius: '8px', color: '#fff' }} />
                                <Legend />
                                <Bar dataKey="utilization" fill="#14b8a6" radius={[0, 4, 4, 0]} name="Utilization (%)" barSize={20}>
                                    {venueUtilization.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Speaker Ratings */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 }}
                    className="glass p-6 rounded-2xl shadow-xl h-96 flex flex-col"
                >
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><span>⭐</span> Speaker Ratings</h3>
                    <div className="flex-1 w-full min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={speakerStats} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#444" vertical={false} />
                                <XAxis dataKey="name" stroke="#888" tick={{fontSize: 12}} />
                                <YAxis stroke="#888" domain={[0, 5]} />
                                <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid #333', borderRadius: '8px', color: '#fff' }} />
                                <Legend />
                                <Bar dataKey="rating" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Average Rating" barSize={30} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>
            </div>

            {/* Global Modal Overlay */}
            <AnimatePresence>
                {activeModal && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
                        onClick={() => setActiveModal(null)}
                    >
                        {renderModalContent()}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
