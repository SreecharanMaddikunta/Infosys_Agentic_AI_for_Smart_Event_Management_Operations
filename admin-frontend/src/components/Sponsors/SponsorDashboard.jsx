import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, AlertTriangle, CheckCircle, Search, Activity, Target, Edit2, X } from 'lucide-react';
import io from 'socket.io-client';

const socket = io('http://localhost:5000');

const SponsorDashboard = () => {
  const [sponsors, setSponsors] = useState([]);
  const [selectedSponsor, setSelectedSponsor] = useState(null);
  const [insights, setInsights] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ 
      id: null, 
      paymentStatus: 'Pending', 
      boothAllocated: false,
      engagementScore: 0,
      leadsGenerated: 0,
      deliverablesCompleted: 0,
      performanceStatus: 'Good'
  });

  const [errorMsg, setErrorMsg] = useState('');

  const fetchSponsors = async () => {
    try {
        setErrorMsg('');
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5000/api/sponsors', { headers: { Authorization: `Bearer ${token}` } });
        const formattedSponsors = res.data.map(s => ({
            id: s.id,
            name: s.name,
            eventName: s.event ? s.event.title : 'Unassigned',
            tier: s.tier || 'Silver',
            paymentStatus: s.paymentStatus || 'Pending',
            passesAllocated: s.passesAllocated || 0,
            boothAllocated: s.boothAllocated || false,
            engagementScore: s.engagementScore || 0,
            leadsGenerated: s.leadsGenerated || 0,
            deliverablesCompleted: s.deliverablesCompleted || 0,
            performanceStatus: s.performanceStatus || 'Good'
        }));
        setSponsors(formattedSponsors);
    } catch (error) {
        console.error('Error fetching real sponsors:', error);
        setErrorMsg(error.response?.data?.error || error.message || 'Failed to load sponsors.');
    }
  };

  useEffect(() => {
    fetchSponsors();
    
    socket.on('sponsor_added', (newSponsor) => {
        const formatted = {
            id: newSponsor.id,
            name: newSponsor.name,
            eventName: newSponsor.event ? newSponsor.event.title : 'Unassigned',
            tier: newSponsor.tier || 'Silver',
            paymentStatus: newSponsor.paymentStatus || 'Pending',
            passesAllocated: newSponsor.passesAllocated || 0,
            boothAllocated: newSponsor.boothAllocated || false,
            engagementScore: newSponsor.engagementScore || 0,
            leadsGenerated: newSponsor.leadsGenerated || 0,
            deliverablesCompleted: newSponsor.deliverablesCompleted || 0,
            performanceStatus: newSponsor.performanceStatus || 'Good'
        };
        setSponsors(prev => [formatted, ...prev]);
    });

    socket.on('sponsorship_updated', (updatedSponsor) => {
        setSponsors(prev => prev.map(s => s.id === updatedSponsor.id ? { 
            ...s, 
            paymentStatus: updatedSponsor.paymentStatus, 
            boothAllocated: updatedSponsor.boothAllocated,
            passesAllocated: updatedSponsor.passesAllocated,
            engagementScore: updatedSponsor.engagementScore || 0,
            leadsGenerated: updatedSponsor.leadsGenerated || 0,
            deliverablesCompleted: updatedSponsor.deliverablesCompleted || 0,
            performanceStatus: updatedSponsor.performanceStatus || 'Good'
        } : s));
    });

    return () => {
        socket.off('sponsor_added');
        socket.off('sponsorship_updated');
    };
  }, []);

    const handleAnalyze = async (sponsor) => {
        setSelectedSponsor(sponsor);
        setInsights(null); // Reset while loading
        try {
            // Trigger Python AI Agent for Predictive Analysis
            const res = await axios.post('http://localhost:8000/api/sponsor-agent/insights', sponsor);
            setInsights(res.data);
        } catch (error) {
            console.error('Error fetching AI insights', error);
            setInsights({
                prediction: "Good",
                confidence: 0.8,
                recommendation: "AI Agent offline. Check backend connectivity."
            });
        }
    };

  const openEditModal = (sponsor) => {
      setFormData({
          id: sponsor.id,
          paymentStatus: sponsor.paymentStatus,
          boothAllocated: sponsor.boothAllocated,
          engagementScore: sponsor.engagementScore,
          leadsGenerated: sponsor.leadsGenerated,
          deliverablesCompleted: sponsor.deliverablesCompleted,
          performanceStatus: sponsor.performanceStatus
      });
      setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
      e.preventDefault();
      try {
          const token = localStorage.getItem('token');
          await axios.put(`http://localhost:5000/api/sponsors/${formData.id}/metrics`, formData, {
              headers: { Authorization: `Bearer ${token}` }
          });
          
          setIsModalOpen(false);
          // Don't need to manually update state; socket will catch 'sponsorship_updated'
      } catch (err) {
          console.error("Error updating sponsor:", err);
          alert("Failed to update sponsor.");
      }
  };

  const filteredSponsors = sponsors.filter(s => 
      s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Sponsorship Fulfillment</h1>
          <p className="text-muted-foreground mt-1">Manage payments, deliverables, and AI insights</p>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <input 
              type="text" 
              placeholder="Search sponsors..." 
              className="w-full pl-10 pr-4 py-2 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>
      {errorMsg && (
          <div className="bg-red-500/20 text-red-500 border border-red-500/50 p-4 rounded-xl flex items-center gap-3">
              <AlertTriangle size={20} />
              <p className="font-medium">{errorMsg}</p>
          </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 glass rounded-xl border border-border overflow-hidden">
              <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                      <thead>
                          <tr className="bg-secondary/30 border-b border-border">
                              <th className="p-4 font-semibold text-sm text-muted-foreground">Sponsor</th>
                              <th className="p-4 font-semibold text-sm text-muted-foreground">Event</th>
                              <th className="p-4 font-semibold text-sm text-muted-foreground">Payment</th>
                              <th className="p-4 font-semibold text-sm text-muted-foreground">Engagement</th>
                              <th className="p-4 font-semibold text-sm text-muted-foreground">Leads</th>
                              <th className="p-4 font-semibold text-sm text-muted-foreground">Deliverables</th>
                              <th className="p-4 font-semibold text-sm text-muted-foreground">Performance</th>
                              <th className="p-4 font-semibold text-sm text-muted-foreground">Action</th>
                          </tr>
                      </thead>
                      <tbody>
                          {filteredSponsors.map(s => (
                              <tr key={s.id} className="border-b border-border hover:bg-secondary/10 transition-colors">
                                  <td className="p-4 font-medium text-white">{s.name}</td>
                                  <td className="p-4 text-sm text-slate-300">{s.eventName}</td>
                                  <td className="p-4">
                                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                          s.paymentStatus === 'Paid' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                                      }`}>
                                          {s.paymentStatus}
                                      </span>
                                  </td>
                                  <td className="p-4 text-sm text-slate-300 font-medium">{s.engagementScore}%</td>
                                  <td className="p-4 text-sm text-slate-300 font-medium">{s.leadsGenerated}</td>
                                  <td className="p-4 text-sm text-slate-300 font-medium">{s.deliverablesCompleted}%</td>
                                  <td className="p-4 text-sm">
                                      <span className={`font-medium ${
                                          s.performanceStatus === 'Excellent' ? 'text-green-400' :
                                          s.performanceStatus === 'At Risk' ? 'text-red-400' : 'text-yellow-400'
                                      }`}>
                                          {s.performanceStatus}
                                      </span>
                                  </td>
                                  <td className="p-4 flex items-center gap-2">
                                      <button 
                                          onClick={() => openEditModal(s)}
                                          className="p-1.5 bg-secondary hover:bg-muted rounded text-muted-foreground hover:text-primary transition-colors"
                                          title="Update Fulfillment"
                                      >
                                          <Edit2 size={16} />
                                      </button>
                                      <button 
                                          onClick={() => handleAnalyze(s)}
                                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                              selectedSponsor?.id === s.id 
                                              ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30' 
                                              : 'bg-secondary hover:bg-secondary/80 text-secondary-foreground'
                                          }`}
                                      >
                                          Analyze
                                      </button>
                                  </td>
                              </tr>
                          ))}
                          {filteredSponsors.length === 0 && (
                              <tr>
                                  <td colSpan="6" className="p-8 text-center text-muted-foreground">
                                      No sponsors found matching your criteria.
                                  </td>
                              </tr>
                          )}
                      </tbody>
                  </table>
              </div>
          </div>

          <div className="lg:col-span-1">
              {selectedSponsor ? (
                  <motion.div 
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="glass rounded-xl border border-border p-6 h-full"
                  >
                      <div className="flex items-center gap-3 mb-6">
                          <div className="p-2 bg-primary/20 rounded-lg text-primary">
                              <Activity size={24} />
                          </div>
                          <h2 className="text-xl font-bold">AI Insights Panel</h2>
                      </div>
                      
                      <div className="mb-6">
                          <div className="text-sm text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Currently Analyzing</div>
                          <div className="text-2xl font-bold gradient-text">{selectedSponsor.name}</div>
                      </div>

                      <div className="space-y-6">
                          <div className="bg-secondary/30 p-4 rounded-xl border border-border/50">
                              <div className="text-sm text-muted-foreground mb-2 uppercase tracking-wider font-semibold">Predicted Trajectory</div>
                              <div className={`flex items-center gap-2 text-lg font-bold ${
                                  insights?.prediction === 'Excellent' ? 'text-green-500' :
                                  insights?.prediction === 'At Risk' ? 'text-red-500' : 'text-yellow-500'
                              }`}>
                                  {insights?.prediction === 'Excellent' ? <TrendingUp size={20} /> :
                                   insights?.prediction === 'At Risk' ? <AlertTriangle size={20} /> : <CheckCircle size={20} />}
                                  {insights ? insights.prediction : 'Analyzing...'}
                              </div>
                          </div>

                          <div className="bg-secondary/30 p-4 rounded-xl border border-border/50">
                              <div className="text-sm text-muted-foreground mb-3 uppercase tracking-wider font-semibold">Recommended Action</div>
                              <p className="text-sm leading-relaxed text-foreground/90">
                                  {insights ? insights.recommendation : 'Gathering data parameters and querying language model...'}
                              </p>
                          </div>
                      </div>

                      {!insights && (
                          <div className="mt-8 flex flex-col items-center justify-center text-muted-foreground">
                              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                              <p className="text-sm animate-pulse">Running AI predictive models...</p>
                          </div>
                      )}
                  </motion.div>
              ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground border-2 border-dashed border-border rounded-xl h-full">
                      <Target size={48} className="mb-4 opacity-20" />
                      <p className="text-sm max-w-[200px]">Select a sponsor from the dashboard to generate AI predictions.</p>
                  </div>
              )}
          </div>
      </div>

      {/* Fulfillment Modal */}
      <AnimatePresence>
          {isModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
                  <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="glass bg-background border border-border p-6 rounded-2xl shadow-2xl w-full max-w-md relative"
                  >
                      <button 
                          onClick={() => setIsModalOpen(false)} 
                          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-colors"
                      >
                          <X size={20} />
                      </button>
                      
                      <h2 className="text-2xl font-bold mb-6 gradient-text">
                          Update Fulfillment
                      </h2>
                      
                      <form onSubmit={handleFormSubmit} className="space-y-6">
                          <div className="grid grid-cols-2 gap-4">
                              <div>
                                  <label className="block text-sm font-medium mb-1 text-slate-300">Payment Status</label>
                                  <select 
                                      className="w-full bg-input border border-border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                                      value={formData.paymentStatus}
                                      onChange={e => setFormData({...formData, paymentStatus: e.target.value})}
                                  >
                                      <option value="Pending">Pending</option>
                                      <option value="Paid">Paid</option>
                                  </select>
                              </div>
                              <div>
                                  <label className="block text-sm font-medium mb-1 text-slate-300">Performance</label>
                                  <select 
                                      className="w-full bg-input border border-border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                                      value={formData.performanceStatus}
                                      onChange={e => setFormData({...formData, performanceStatus: e.target.value})}
                                  >
                                      <option value="Excellent">Excellent</option>
                                      <option value="Good">Good</option>
                                      <option value="At Risk">At Risk</option>
                                  </select>
                              </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                              <div>
                                  <label className="block text-sm font-medium mb-1 text-slate-300">Engagement (%)</label>
                                  <input 
                                      type="number" 
                                      min="0" max="100" required
                                      className="w-full bg-input border border-border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                                      value={formData.engagementScore}
                                      onChange={e => setFormData({...formData, engagementScore: parseInt(e.target.value) || 0})}
                                  />
                              </div>
                              <div>
                                  <label className="block text-sm font-medium mb-1 text-slate-300">Deliverables (%)</label>
                                  <input 
                                      type="number" 
                                      min="0" max="100" required
                                      className="w-full bg-input border border-border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                                      value={formData.deliverablesCompleted}
                                      onChange={e => setFormData({...formData, deliverablesCompleted: parseInt(e.target.value) || 0})}
                                  />
                              </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                              <div>
                                  <label className="block text-sm font-medium mb-1 text-slate-300">Leads Generated</label>
                                  <input 
                                      type="number" 
                                      min="0" required
                                      className="w-full bg-input border border-border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                                      value={formData.leadsGenerated}
                                      onChange={e => setFormData({...formData, leadsGenerated: parseInt(e.target.value) || 0})}
                                  />
                              </div>
                              <div className="flex items-end pb-1">
                                  <div className="flex items-center gap-3 w-full p-2 bg-secondary/30 rounded-lg border border-border">
                                      <input 
                                          type="checkbox"
                                          id="boothCheck"
                                          checked={formData.boothAllocated}
                                          onChange={e => setFormData({...formData, boothAllocated: e.target.checked})}
                                          className="w-5 h-5 rounded border-gray-600 text-primary focus:ring-primary bg-input"
                                      />
                                      <label htmlFor="boothCheck" className="text-sm font-medium text-slate-200 cursor-pointer">
                                          Booth Allocated
                                      </label>
                                  </div>
                              </div>
                          </div>

                          <div className="pt-2 flex justify-end gap-3">
                              <button 
                                  type="button" 
                                  onClick={() => setIsModalOpen(false)}
                                  className="px-4 py-2 rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
                              >
                                  Cancel
                              </button>
                              <button 
                                  type="submit" 
                                  className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                              >
                                  Save Status
                              </button>
                          </div>
                      </form>
                  </motion.div>
              </div>
          )}
      </AnimatePresence>
    </motion.div>
  );
};

export default SponsorDashboard;
