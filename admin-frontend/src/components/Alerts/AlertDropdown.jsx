import React, { useState, useEffect } from "react";
import { Bell, X, AlertTriangle, Info, ShieldAlert } from "lucide-react";
import io from "socket.io-client";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";

const socket = io("http://localhost:5000");

const AlertDropdown = () => {
    const [alerts, setAlerts] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [toast, setToast] = useState(null);

    useEffect(() => {
        fetchAlerts();
        
        socket.on("new_alert", (alert) => {
            setAlerts(prev => [alert, ...prev]);
            
            // Pop Toast for CRITICAL and HIGH
            if (alert.type === "CRITICAL" || alert.type === "HIGH") {
                setToast(alert);
                // Auto hide toast after 8 seconds
                setTimeout(() => setToast(null), 8000);
            }
        });

        return () => {
            socket.off("new_alert");
        };
    }, []);

    const fetchAlerts = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await axios.get("http://localhost:5000/api/alerts", {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAlerts(res.data);
        } catch (error) {
            console.error("Failed to fetch alerts:", error);
        }
    };

    const markAsRead = async (id) => {
        try {
            const token = localStorage.getItem("token");
            await axios.put(`http://localhost:5000/api/alerts/${id}/read`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAlerts(prev => prev.map(a => a.id === id ? { ...a, isRead: true } : a));
        } catch (error) {
            console.error("Failed to mark as read:", error);
        }
    };

    const unreadCount = alerts.filter(a => !a.isRead).length;

    const getIcon = (type) => {
        switch(type) {
            case "CRITICAL": return <AlertTriangle className="text-red-500" size={20} />;
            case "HIGH": return <ShieldAlert className="text-orange-500" size={20} />;
            case "INFO": return <Info className="text-blue-400" size={20} />;
            default: return <Info className="text-slate-400" size={20} />;
        }
    };

    return (
        <div className="relative">
            {/* Bell Icon */}
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-full hover:bg-muted transition"
            >
                <Bell size={20} className="text-slate-200" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-background">
                        {unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown Panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-3 w-80 sm:w-96 glass bg-background border border-border shadow-2xl rounded-2xl overflow-hidden z-50"
                    >
                        <div className="p-4 border-b border-border bg-secondary/20 flex justify-between items-center">
                            <h3 className="font-bold text-lg">Operational Alerts</h3>
                            <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-white">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="max-h-[400px] overflow-y-auto">
                            {alerts.length === 0 ? (
                                <div className="p-8 text-center text-muted-foreground">No recent alerts.</div>
                            ) : (
                                alerts.map(alert => (
                                    <div 
                                        key={alert.id} 
                                        onClick={() => markAsRead(alert.id)}
                                        className={`p-4 border-b border-border/50 hover:bg-secondary/30 transition cursor-pointer flex gap-3 ${!alert.isRead ? "bg-primary/5" : ""}`}
                                    >
                                        <div className="mt-0.5 flex-shrink-0">{getIcon(alert.type)}</div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`text-xs font-bold ${
                                                    alert.type === "CRITICAL" ? "text-red-400" :
                                                    alert.type === "HIGH" ? "text-orange-400" : "text-blue-400"
                                                }`}>{alert.type}</span>
                                                <span className="text-[10px] text-muted-foreground px-1.5 py-0.5 rounded-full bg-secondary">
                                                    {alert.source}
                                                </span>
                                            </div>
                                            <p className={`text-sm ${!alert.isRead ? "text-white font-medium" : "text-slate-400"}`}>
                                                {alert.message}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Global Toast Notification */}
            <AnimatePresence>
                {toast && (
                    <motion.div 
                        initial={{ opacity: 0, y: -50, x: "-50%" }}
                        animate={{ opacity: 1, y: 20, x: "-50%" }}
                        exit={{ opacity: 0, y: -50, x: "-50%" }}
                        className={`fixed top-4 left-1/2 z-[100] w-full max-w-md p-4 rounded-xl shadow-2xl border-l-4 flex gap-4 items-start ${
                            toast.type === "CRITICAL" ? "bg-red-950/90 border-red-500 shadow-red-900/20" : 
                            "bg-orange-950/90 border-orange-500 shadow-orange-900/20"
                        } backdrop-blur-md`}
                    >
                        <div className="flex-shrink-0">
                            {getIcon(toast.type)}
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-white mb-1">
                                {toast.type} ALERT DETECTED
                            </h4>
                            <p className="text-sm text-slate-200">{toast.message}</p>
                            {toast.source === "AI" && (
                                <span className="inline-block mt-2 text-xs font-medium text-purple-300 bg-purple-900/40 px-2 py-1 rounded">
                                    AI PREDICTIVE INSIGHT
                                </span>
                            )}
                        </div>
                        <button onClick={() => setToast(null)} className="text-slate-400 hover:text-white">
                            <X size={16} />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AlertDropdown;
