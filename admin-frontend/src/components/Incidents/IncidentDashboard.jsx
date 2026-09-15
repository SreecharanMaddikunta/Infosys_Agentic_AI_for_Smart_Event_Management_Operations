import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, AlertTriangle, ShieldAlert, CheckCircle2, X, Activity, Wrench, CheckCircle } from 'lucide-react';
import io from 'socket.io-client';

const socket = io('http://localhost:5000');

const IncidentDashboard = () => {
  const [incidents, setIncidents] = useState([]);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState('');

  const fetchIncidents = async () => {
      try {
          const token = localStorage.getItem('token');
          const res = await axios.get('http://localhost:5000/api/incidents', {
              headers: { Authorization: `Bearer ${token}` }
          });
          setIncidents(res.data);
      } catch (err) {
          console.error(err);
      }
  };

  useEffect(() => {
      fetchIncidents();
      
      socket.on('incident_created', (newIncident) => {
          setIncidents(prev => [newIncident, ...prev]);
      });
      
      socket.on('incident_updated', (updatedIncident) => {
          setIncidents(prev => prev.map(inc => inc.id === updatedIncident.id ? updatedIncident : inc));
          // If the admin is currently viewing this exact incident, update the modal live
          setSelectedIncident(prev => prev && prev.id === updatedIncident.id ? updatedIncident : prev);
      });
      
      socket.on('incident_deleted', (data) => {
          setIncidents(prev => prev.filter(inc => inc.id !== data.id));
          setSelectedIncident(prev => prev && prev.id === data.id ? null : prev);
      });

      return () => {
          socket.off('incident_created');
          socket.off('incident_updated');
          socket.off('incident_deleted');
      };
  }, []);

  const handleUpdateStatus = async (id, newStatus, notes = '') => {
      try {
          const token = localStorage.getItem('token');
          await axios.put(`http://localhost:5000/api/incidents/${id}/status`, { 
              status: newStatus,
              resolutionNotes: notes
          }, {
              headers: { Authorization: `Bearer ${token}` }
          });
          
          fetchIncidents();
          
          if (selectedIncident && selectedIncident.id === id) {
              setSelectedIncident(null);
              setResolutionNotes('');
          }
      } catch (err) {
          console.error("Failed to update status", err);
      }
  };

  const handleDeleteIncident = async (id) => {
      if (!window.confirm("Are you sure you want to permanently delete this closed incident?")) return;
      
      try {
          const token = localStorage.getItem('token');
          await axios.delete(`http://localhost:5000/api/incidents/${id}`, {
              headers: { Authorization: `Bearer ${token}` }
          });
          
          fetchIncidents();
          
          if (selectedIncident && selectedIncident.id === id) {
              setSelectedIncident(null);
              setResolutionNotes('');
          }
      } catch (err) {
          console.error("Failed to delete incident", err);
          alert("Failed to delete incident.");
      }
  };

  const getStatusColor = (status) => {
      switch(status) {
          case 'Logged': return 'bg-slate-100 border-slate-200 dark:bg-slate-800 dark:border-slate-700';
          case 'Investigating': return 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800';
          case 'Resolved': return 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800';
          case 'Closed': return 'bg-gray-50 border-gray-200 dark:bg-gray-900/20 dark:border-gray-800 opacity-70';
          default: return 'bg-gray-100 border-gray-200';
      }
  };

  const getSeverityBadge = (sev) => {
      if (sev === 'Critical') return <span className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400 px-2 py-1 rounded-full"><ShieldAlert size={12}/> {sev}</span>;
      if (sev === 'High') return <span className="flex items-center gap-1 text-xs font-bold text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400 px-2 py-1 rounded-full"><AlertTriangle size={12}/> {sev}</span>;
      if (sev === 'Medium') return <span className="flex items-center gap-1 text-xs font-medium text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400 px-2 py-1 rounded-full"><AlertCircle size={12}/> {sev}</span>;
      return <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400 px-2 py-1 rounded-full"><CheckCircle2 size={12}/> {sev}</span>;
  };

  const openModal = (incident) => {
      setSelectedIncident(incident);
      setResolutionNotes(incident.resolutionNotes || '');
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-6">
      <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold gradient-text">Incident Management</h2>
            <p className="text-muted-foreground mt-1">Real-time workflow tracking and operational alerts</p>
          </div>
      </div>
      
      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {['Logged', 'Investigating', 'Resolved', 'Closed'].map((statusCol, colIdx) => (
              <div key={statusCol} className="glass rounded-2xl p-4 min-h-[500px] border border-border flex flex-col">
                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-border">
                      <h3 className="font-bold text-lg">{statusCol}</h3>
                      <span className="bg-muted text-muted-foreground text-xs font-bold px-2 py-1 rounded-full">
                          {incidents.filter(i => i.status === statusCol).length}
                      </span>
                  </div>
                  
                  <div className="flex-1 space-y-4">
                      {incidents.filter(i => i.status === statusCol).map((incident, idx) => (
                          <motion.div 
                              initial={{ opacity: 0, scale: 0.9 }} 
                              animate={{ opacity: 1, scale: 1 }} 
                              transition={{ delay: idx * 0.1 }}
                              key={incident.id} 
                              onClick={() => openModal(incident)}
                              className={`p-4 rounded-xl border shadow-sm ${getStatusColor(incident.status)} transition-all hover:shadow-md cursor-pointer hover:ring-2 hover:ring-primary/50 relative group`}
                          >
                              <div className="flex justify-between items-start mb-2">
                                  {getSeverityBadge(incident.severity)}
                                  <span className="text-xs font-bold text-muted-foreground">{new Date(incident.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                              </div>
                              {incident.photoBase64 && (
                                  <div className="w-full h-32 overflow-hidden rounded-lg mb-3">
                                    <img src={incident.photoBase64} alt="Incident" className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                                  </div>
                              )}
                              <p className="text-sm font-semibold mb-3 leading-snug line-clamp-3">{incident.description}</p>
                              
                              <div className="flex items-center justify-between mt-auto pt-3 border-t border-black/5 dark:border-white/5">
                                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{incident.category}</span>
                                  <span className="text-[10px] font-bold bg-background px-2 py-1 rounded shadow-sm">{incident.responsibleTeam || incident.team}</span>
                              </div>
                          </motion.div>
                      ))}
                      {incidents.filter(i => i.status === statusCol).length === 0 && (
                          <div className="text-center p-6 border-2 border-dashed border-border rounded-xl text-muted-foreground text-sm">
                              No incidents
                          </div>
                      )}
                  </div>
              </div>
          ))}
      </div>

      {/* Detailed Resolution Modal */}
      <AnimatePresence>
          {selectedIncident && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                  <motion.div 
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                      onClick={() => setSelectedIncident(null)}
                  />
                  <motion.div 
                      initial={{ opacity: 0, scale: 0.95, y: 20 }} 
                      animate={{ opacity: 1, scale: 1, y: 0 }} 
                      exit={{ opacity: 0, scale: 0.95, y: 20 }}
                      className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-background border border-border shadow-2xl rounded-2xl flex flex-col"
                  >
                      {/* Modal Header */}
                      <div className="flex justify-between items-center p-6 border-b border-border sticky top-0 bg-background/95 backdrop-blur z-10">
                          <div className="flex items-center gap-3">
                              <h2 className="text-2xl font-bold">Incident #{selectedIncident.id}</h2>
                              <span className="text-sm font-bold px-3 py-1 bg-muted rounded-full uppercase tracking-widest">{selectedIncident.status}</span>
                          </div>
                          <button onClick={() => setSelectedIncident(null)} className="p-2 hover:bg-muted rounded-full transition"><X size={24} /></button>
                      </div>

                      {/* Modal Body */}
                      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                          
                          {/* Left Column: Details & Media */}
                          <div className="flex flex-col gap-6">
                              <div>
                                  <h4 className="text-xs uppercase tracking-wider text-muted-foreground font-bold mb-2">Description</h4>
                                  <p className="text-foreground font-medium bg-muted/50 p-4 rounded-xl border border-border/50 leading-relaxed">
                                      {selectedIncident.description}
                                  </p>
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                  <div className="bg-muted/50 p-3 rounded-xl border border-border/50">
                                      <span className="text-xs text-muted-foreground block mb-1">Time Reported</span>
                                      <span className="font-semibold text-sm">{new Date(selectedIncident.createdAt).toLocaleString()}</span>
                                  </div>
                                  <div className="bg-muted/50 p-3 rounded-xl border border-border/50">
                                      <span className="text-xs text-muted-foreground block mb-1">Incident Type</span>
                                      <span className="font-semibold text-sm">{selectedIncident.incidentType || selectedIncident.category}</span>
                                  </div>
                              </div>

                              {selectedIncident.photoBase64 && (
                                  <div>
                                      <h4 className="text-xs uppercase tracking-wider text-muted-foreground font-bold mb-2">Attached Photo</h4>
                                      <img src={selectedIncident.photoBase64} alt="Incident" className="w-full rounded-xl border border-border shadow-sm" />
                                  </div>
                              )}
                          </div>

                          {/* Right Column: AI Analysis & Resolution */}
                          <div className="flex flex-col gap-6">
                              
                              <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 shadow-inner">
                                  <h4 className="flex items-center gap-2 font-bold text-primary mb-4">
                                      <Activity size={18}/> AI Intelligence
                                  </h4>
                                  
                                  <div className="space-y-3">
                                      <div className="flex justify-between items-center">
                                          <span className="text-sm text-muted-foreground">Severity</span>
                                          {getSeverityBadge(selectedIncident.severity)}
                                      </div>
                                      <div className="flex justify-between items-center">
                                          <span className="text-sm text-muted-foreground">Priority</span>
                                          <span className="font-semibold text-sm">{selectedIncident.priority}</span>
                                      </div>
                                      <div className="flex justify-between items-center">
                                          <span className="text-sm text-muted-foreground">Responsible Team</span>
                                          <span className="font-semibold text-sm">{selectedIncident.responsibleTeam}</span>
                                      </div>
                                      
                                      <div className="pt-3 mt-3 border-t border-primary/10">
                                          <span className="text-sm text-muted-foreground block mb-1">Recommended Action</span>
                                          <p className="text-sm font-semibold">{selectedIncident.recommendedAction}</p>
                                      </div>
                                  </div>
                              </div>

                              <div className="flex-1 flex flex-col">
                                  <h4 className="text-xs uppercase tracking-wider text-muted-foreground font-bold mb-2">Resolution Notes</h4>
                                  <textarea 
                                      className="w-full flex-1 min-h-[120px] bg-input border border-border p-4 rounded-xl focus:ring-2 focus:ring-primary/50 outline-none resize-none"
                                      placeholder="Explain how this incident was or will be solved..."
                                      value={resolutionNotes}
                                      onChange={(e) => setResolutionNotes(e.target.value)}
                                      disabled={selectedIncident.status === 'Closed'}
                                  />
                              </div>
                          </div>
                      </div>

                      {/* Modal Footer (Actions) */}
                      <div className="p-6 border-t border-border bg-muted/30 flex flex-wrap justify-end gap-3 rounded-b-2xl">
                          {selectedIncident.status === 'Logged' && (
                              <button 
                                  onClick={() => handleUpdateStatus(selectedIncident.id, 'Investigating', resolutionNotes)}
                                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition flex items-center gap-2"
                              >
                                  Start Investigating
                              </button>
                          )}
                          
                          {(selectedIncident.status === 'Logged' || selectedIncident.status === 'Investigating') && (
                              <button 
                                  onClick={() => handleUpdateStatus(selectedIncident.id, 'Resolved', resolutionNotes)}
                                  className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg shadow-green-500/20 transition flex items-center gap-2"
                              >
                                  <Wrench size={18}/> Resolve Incident
                              </button>
                          )}

                          {selectedIncident.status === 'Resolved' && (
                              <button 
                                  onClick={() => handleUpdateStatus(selectedIncident.id, 'Closed', resolutionNotes)}
                                  className="px-5 py-2.5 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-xl shadow-lg shadow-gray-500/20 transition flex items-center gap-2"
                              >
                                  <CheckCircle size={18}/> Close Incident
                              </button>
                          )}
                          
                          {selectedIncident.status === 'Closed' && (
                              <div className="flex items-center gap-4">
                                  <span className="px-5 py-2.5 text-muted-foreground font-bold flex items-center gap-2">
                                      <CheckCircle size={18} className="text-green-500"/> Incident is Closed
                                  </span>
                                  <button 
                                      onClick={() => handleDeleteIncident(selectedIncident.id)}
                                      className="px-4 py-2.5 bg-red-600/10 hover:bg-red-600 hover:text-white text-red-600 font-bold rounded-xl transition flex items-center gap-2"
                                  >
                                      Delete Incident
                                  </button>
                              </div>
                          )}
                      </div>
                  </motion.div>
              </div>
          )}
      </AnimatePresence>
    </motion.div>
  );
};

export default IncidentDashboard;
