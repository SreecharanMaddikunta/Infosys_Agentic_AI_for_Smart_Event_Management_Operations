import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';

export default function ConflictResolution({ onUpdate }) {
    const [flagged, setFlagged] = useState([]);

    useEffect(() => {
        fetchFlagged();
    }, []);

    const fetchFlagged = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/admin/registrations?status=REJECTED', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setFlagged(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleOverride = async (id) => {
        try {
            const token = localStorage.getItem('token');
            await axios.post(`http://localhost:5000/api/admin/registrations/${id}/override`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchFlagged();
            if(onUpdate) onUpdate();
        } catch (err) {
            console.error(err);
        }
    };

    if (flagged.length === 0) return null;

    return (
        <div className="glass p-6 rounded-2xl border-l-4 border-yellow-500 mb-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                <span className="text-8xl">⚠️</span>
            </div>
            
            <h3 className="text-2xl font-semibold mb-4 text-yellow-500 flex items-center gap-2">
                <span>🤖</span> AI Conflict Resolution Needed
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
                The AI detected potential duplicate registrations. Please review and manually override if these are distinct individuals.
            </p>
            
            <div className="space-y-3">
                {flagged.map((reg, idx) => (
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        key={reg.id} 
                        className="bg-black/40 p-4 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                    >
                        <div>
                            <h4 className="font-bold">{reg.student?.name} <span className="text-muted-foreground font-normal text-sm">({reg.student?.email})</span></h4>
                            <p className="text-xs text-muted-foreground mt-1">Event: {reg.event?.title} | Match Confidence: High</p>
                        </div>
                        <div className="flex gap-3 w-full md:w-auto">
                            <button 
                                onClick={() => handleOverride(reg.id)}
                                className="bg-green-500/20 text-green-400 hover:bg-green-500 hover:text-white border border-green-500/30 px-4 py-2 rounded-lg text-sm font-semibold transition flex-1 md:flex-none"
                            >
                                Override to Approved
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
