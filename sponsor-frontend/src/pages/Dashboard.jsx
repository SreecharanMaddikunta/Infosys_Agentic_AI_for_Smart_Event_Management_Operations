import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, LogOut, CheckCircle, Award, Trash2 } from 'lucide-react';
import io from 'socket.io-client';

const socket = io('http://localhost:5000');

export default function Dashboard() {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [mySponsorships, setMySponsorships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('available');
  const [pendingSponsorship, setPendingSponsorship] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchEvents();
    fetchMySponsorships();
    
    socket.on('sponsorship_updated', (updatedSponsor) => {
        setMySponsorships(prev => prev.map(s => s.id === updatedSponsor.id ? { ...s, ...updatedSponsor } : s));
    });
    
    socket.on('event_created', () => { fetchEvents(); });
    socket.on('event_updated', () => { fetchEvents(); });

    return () => {
        socket.off('sponsorship_updated');
        socket.off('event_created');
        socket.off('event_updated');
    };
  }, []);

  const fetchEvents = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/events', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setEvents(await response.json());
      }
    } catch (err) {
      console.error("Error fetching events:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMySponsorships = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/sponsors/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setMySponsorships(await response.json());
      }
    } catch (err) {
      console.error("Error fetching sponsorships:", err);
    }
  };

  const cancelSponsorship = async (id) => {
      if (!window.confirm("Are you sure you want to cancel this sponsorship?")) return;
      try {
          const token = localStorage.getItem('token');
          const response = await fetch(`http://localhost:5000/api/sponsors/${id}`, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${token}` }
          });
          if (response.ok) {
              setMySponsorships(prev => prev.filter(s => s.id !== id));
          } else {
              alert('Failed to cancel sponsorship.');
          }
      } catch (err) {
          console.error("Error deleting sponsorship:", err);
      }
  };

  const confirmSponsorship = async () => {
    if (!selectedEvent || !pendingSponsorship) return;
    
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/sponsors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          eventId: selectedEvent.id || selectedEvent._id,
          tier: pendingSponsorship
        })
      });
      
      if (response.ok) {
        setPendingSponsorship(null);
        setSelectedEvent(null);
        fetchMySponsorships();
        setActiveTab('mine');
      } else {
        alert('Failed to submit sponsorship');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred while confirming sponsorship.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="min-h-screen p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-center mb-8 glass p-4 rounded-xl gap-4">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Award className="text-yellow-400" /> Sponsor Portal
          </h1>
          
          <div className="flex bg-slate-900/80 p-1 rounded-lg border border-slate-700">
            <button 
              onClick={() => setActiveTab('available')}
              className={`px-6 py-2 rounded-md font-semibold text-sm transition-all duration-200 ${activeTab === 'available' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
            >
              Available Events
            </button>
            <button 
              onClick={() => setActiveTab('mine')}
              className={`px-6 py-2 rounded-md font-semibold text-sm transition-all duration-200 ${activeTab === 'mine' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
            >
              My Sponsorships
            </button>
          </div>

          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors text-sm font-medium border border-slate-700 text-white"
          >
            <LogOut size={16} /> Logout
          </button>
        </header>

        {activeTab === 'mine' ? (
          <div>
            <h2 className="text-2xl font-bold mb-6 text-slate-100 flex items-center gap-2">
              <CheckCircle className="text-green-400" /> My Active Sponsorships
            </h2>
            {mySponsorships.length === 0 ? (
              <div className="glass p-12 rounded-2xl text-center text-slate-400">
                <Award size={48} className="mx-auto mb-4 text-slate-600" />
                <h3 className="text-xl font-bold text-slate-300 mb-2">No sponsorships yet</h3>
                <p>You haven't sponsored any events yet. Check out the Available Events tab!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {mySponsorships.map(s => (
                  <div key={s.id} className="glass p-6 rounded-2xl border-t-4 border-t-yellow-500 hover:shadow-xl hover:shadow-yellow-900/10 transition-all">
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="text-xl font-bold text-white line-clamp-1 flex-1 pr-2">{s.event?.title || 'Unknown Event'}</h3>
                        <button 
                            onClick={() => cancelSponsorship(s.id)}
                            className="p-1.5 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded transition-colors"
                            title="Cancel Sponsorship"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex justify-between items-center pb-4 border-b border-slate-700/50">
                        <span className="text-slate-400 text-sm">Sponsorship Tier</span>
                        <span className="text-yellow-400 font-bold text-lg">{s.tier}</span>
                      </div>
                      
                      <div className="flex justify-between items-center pb-4 border-b border-slate-700/50">
                        <span className="text-slate-400 text-sm">Payment Status</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${s.paymentStatus === 'Paid' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                          {s.paymentStatus}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 pt-2 text-center">
                        <div className="bg-slate-800/50 rounded-lg p-3">
                          <div className="text-xs text-slate-400 mb-1">Passes</div>
                          <div className="font-semibold text-slate-200">{s.passesAllocated}</div>
                        </div>
                        <div className="bg-slate-800/50 rounded-lg p-3">
                          <div className="text-xs text-slate-400 mb-1">Booth</div>
                          <div className="font-semibold text-slate-200">{s.boothAllocated ? 'Allocated' : 'Pending'}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-4">
              <h2 className="text-xl font-semibold mb-4 text-slate-200">Available Events</h2>
              {loading ? (
                <div className="glass p-8 rounded-xl text-center text-slate-400">Loading events...</div>
              ) : events.length === 0 ? (
                <div className="glass p-8 rounded-xl text-center text-slate-400">No events found.</div>
              ) : (
                events.map(event => (
                  <div 
                    key={event.id || event._id} 
                    onClick={() => setSelectedEvent(event)}
                    className={`glass p-5 rounded-xl cursor-pointer transition-all duration-200 hover:scale-[1.02] ${selectedEvent && (selectedEvent.id === event.id || selectedEvent._id === event._id) ? 'ring-2 ring-blue-500 bg-blue-900/10' : 'hover:bg-slate-800/50'}`}
                  >
                    <h3 className="font-bold text-lg mb-2 text-slate-100">{event.title}</h3>
                    <div className="flex items-center gap-2 text-sm text-slate-400 mb-1">
                      <Calendar size={16} /> {new Date(event.date).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <MapPin size={16} /> {event.location}
                    </div>
                  </div>
                ))
              )}
            </div>

          <div className="lg:col-span-2">
            {selectedEvent ? (
              <div className="glass p-8 rounded-2xl">
                <h2 className="text-2xl font-bold mb-2">{selectedEvent.title}</h2>
                <p className="text-slate-400 mb-8">Choose a sponsorship package that best fits your company's goals.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Silver Tier */}
                  <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 flex flex-col hover:border-slate-500 transition-colors">
                    <h3 className="text-xl font-bold text-slate-300 mb-2">Silver</h3>
                    <div className="text-3xl font-bold text-white mb-6">$1,000</div>
                    <ul className="space-y-3 mb-8 flex-1">
                      <li className="flex items-start gap-2 text-sm text-slate-300">
                        <CheckCircle size={18} className="text-slate-400 shrink-0 mt-0.5" /> Logo on website
                      </li>
                      <li className="flex items-start gap-2 text-sm text-slate-300">
                        <CheckCircle size={18} className="text-slate-400 shrink-0 mt-0.5" /> 1 Attendee pass
                      </li>
                    </ul>
                    <button 
                      onClick={() => setPendingSponsorship('Silver')}
                      className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white border border-slate-600 rounded-lg font-semibold transition-colors"
                    >
                      Select Silver
                    </button>
                  </div>

                  {/* Gold Tier */}
                  <div className="bg-slate-900 border border-yellow-500/50 rounded-xl p-6 flex flex-col relative transform md:-translate-y-4 shadow-xl shadow-yellow-900/10">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-500 text-yellow-950 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                      Popular
                    </div>
                    <h3 className="text-xl font-bold text-yellow-400 mb-2">Gold</h3>
                    <div className="text-3xl font-bold text-white mb-6">$3,000</div>
                    <ul className="space-y-3 mb-8 flex-1">
                      <li className="flex items-start gap-2 text-sm text-slate-300">
                        <CheckCircle size={18} className="text-yellow-400 shrink-0 mt-0.5" /> Logo in prominent location
                      </li>
                      <li className="flex items-start gap-2 text-sm text-slate-300">
                        <CheckCircle size={18} className="text-yellow-400 shrink-0 mt-0.5" /> 3 Attendee passes
                      </li>
                      <li className="flex items-start gap-2 text-sm text-slate-300">
                        <CheckCircle size={18} className="text-yellow-400 shrink-0 mt-0.5" /> Mention in newsletter
                      </li>
                    </ul>
                    <button 
                      onClick={() => setPendingSponsorship('Gold')}
                      className="w-full py-2 bg-yellow-500 hover:bg-yellow-400 text-yellow-950 rounded-lg font-bold transition-colors shadow-lg shadow-yellow-500/20"
                    >
                      Select Gold
                    </button>
                  </div>

                  {/* Platinum Tier */}
                  <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 flex flex-col hover:border-slate-500 transition-colors">
                    <h3 className="text-xl font-bold text-slate-100 mb-2">Platinum</h3>
                    <div className="text-3xl font-bold text-white mb-6">$5,000</div>
                    <ul className="space-y-3 mb-8 flex-1">
                      <li className="flex items-start gap-2 text-sm text-slate-300">
                        <CheckCircle size={18} className="text-blue-400 shrink-0 mt-0.5" /> Headline placement
                      </li>
                      <li className="flex items-start gap-2 text-sm text-slate-300">
                        <CheckCircle size={18} className="text-blue-400 shrink-0 mt-0.5" /> 10 Attendee passes
                      </li>
                      <li className="flex items-start gap-2 text-sm text-slate-300">
                        <CheckCircle size={18} className="text-blue-400 shrink-0 mt-0.5" /> Keynote shoutout
                      </li>
                      <li className="flex items-start gap-2 text-sm text-slate-300">
                        <CheckCircle size={18} className="text-blue-400 shrink-0 mt-0.5" /> Dedicated booth
                      </li>
                    </ul>
                    <button 
                      onClick={() => setPendingSponsorship('Platinum')}
                      className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white border border-slate-600 rounded-lg font-semibold transition-colors"
                    >
                      Select Platinum
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="glass p-12 rounded-2xl flex flex-col items-center justify-center text-center h-full min-h-[400px]">
                <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mb-6 border border-slate-700">
                  <Award size={40} className="text-slate-500" />
                </div>
                <h2 className="text-2xl font-bold text-slate-300 mb-2">Select an Event</h2>
                <p className="text-slate-500 max-w-md">
                  Click on an event from the list to view available sponsorship tiers and opportunities.
                </p>
              </div>
            )}
          </div>
        </div>
        )}
      </div>

      {pendingSponsorship && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass max-w-md w-full rounded-2xl p-6 shadow-2xl border border-slate-700 animate-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-bold text-white mb-2">Confirm Sponsorship</h2>
            <p className="text-slate-300 mb-6">
              You are about to pledge <strong className="text-yellow-400">{pendingSponsorship}</strong> tier for <strong>{selectedEvent?.title}</strong>.
              {pendingSponsorship === 'Platinum' && ' This will secure your headline placement and 10 attendee passes for $5,000.'}
              {pendingSponsorship === 'Gold' && ' This will secure your prominent logo placement and 3 attendee passes for $3,000.'}
              {pendingSponsorship === 'Silver' && ' This will secure your website logo placement and 1 attendee pass for $1,000.'}
            </p>
            
            <div className="flex gap-4 justify-end mt-8">
              <button 
                onClick={() => setPendingSponsorship(null)}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg font-semibold text-slate-300 hover:bg-slate-800 transition-colors border border-slate-700 disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                onClick={confirmSponsorship}
                disabled={isSubmitting}
                className="px-6 py-2 rounded-lg font-bold text-white bg-blue-600 hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/20 flex items-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? 'Confirming...' : 'Confirm Pledge'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
