import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, MapPin, Mic, AlertTriangle, TrendingUp, Brain, Cpu, Zap, X, Activity } from 'lucide-react';
import axios from 'axios';

const AGENT_PROFILES = [
  {
    id: 'VenueAgent',
    name: 'Venue Selection Agent',
    icon: <MapPin className="text-blue-400" size={32} />,
    color: 'blue',
    description: 'Evaluates and recommends optimal venues based on event capacity, required facilities, and attendee demographics.',
    capabilities: [
      'Capacity constraint analysis',
      'Facility matching',
      'Proximity and location scoring',
      'Fallback heuristic prioritization'
    ],
    inputs: ['Event Requirements (capacity, facilities)', 'Available Venues List'],
    outputs: ['Prioritized list of recommended venues with reasoning'],
    workflow: {
      scenario: 'Organizers need to host a "Future of AI" keynote expecting 500 attendees, requiring projector facilities and high-speed Wi-Fi.',
      steps: [
        { title: 'Input Received', desc: 'Analyzes requirements: Capacity: 500, Facilities: Projector, Wi-Fi.' },
        { title: 'Evaluation', desc: 'Scans all venues. Identifies Hall A (600 capacity, all facilities - Score 95) and Hall B (400 capacity - Score 30).' },
        { title: 'Recommendation', desc: 'Suggests Hall A as the primary venue, citing the close capacity match and complete facility availability.' }
      ]
    }
  },
  {
    id: 'SchedulingAgent',
    name: 'Speaker Allocation Agent',
    icon: <Mic className="text-purple-400" size={32} />,
    color: 'purple',
    description: 'Intelligently matches session topics with speaker expertise and analyzes past ratings and availability.',
    capabilities: [
      'Expertise topic modeling',
      'Rating aggregation',
      'Schedule conflict resolution',
      'Semantic matching'
    ],
    inputs: ['Session Topic', 'Time Slot', 'Available Speakers List'],
    outputs: ['Ranked list of suitable speakers with rationale'],
    workflow: {
      scenario: 'A new session "Cloud Native Architectures" needs an available expert speaker.',
      steps: [
        { title: 'Input Received', desc: 'Extracts topic "Cloud Native" and time constraints (2:00 PM - 3:00 PM).' },
        { title: 'Analysis', desc: 'Searches speaker DB. Finds Alice (Cloud expert, but booked) and Bob (Microservices & Cloud expert, available).' },
        { title: 'Allocation', desc: 'Allocates Bob with a priority score of 98, highlighting his availability and high past ratings in similar topics.' }
      ]
    }
  },
  {
    id: 'IncidentAgent',
    name: 'Incident Response Agent',
    icon: <AlertTriangle className="text-red-400" size={32} />,
    color: 'red',
    description: 'Processes real-time incident reports, categorizes severity, and generates immediate actionable response protocols.',
    capabilities: [
      'Severity classification',
      'Team routing',
      'Action plan generation',
      'Duplicate incident detection'
    ],
    inputs: ['Raw incident reports', 'Photos/Evidence', 'Reporter context'],
    outputs: ['Categorized Incident object', 'Actionable routing & recommendations'],
    workflow: {
      scenario: 'An attendee reports via the app that the microphone is not working in Hall B during a live presentation.',
      steps: [
        { title: 'Detection', desc: 'Receives the raw report "Mic broken in Hall B".' },
        { title: 'Classification', desc: 'Categorizes issue as "Technical" and severity as "Critical" (due to live session disruption).' },
        { title: 'Routing', desc: 'Instantly dispatches an alert to the on-site AV/IT team specifying location "Hall B".' },
        { title: 'Resolution Strategy', desc: 'Recommends the speaker switch to the backup lapel mic while IT replaces the primary handheld mic.' }
      ]
    }
  },
  {
    id: 'SponsorshipAgent',
    name: 'Sponsorship Insights Agent',
    icon: <TrendingUp className="text-green-400" size={32} />,
    color: 'green',
    description: 'Analyzes sponsor engagement metrics to predict ROI and identify sponsors at risk of low engagement.',
    capabilities: [
      'ROI prediction modeling',
      'Engagement anomaly detection',
      'Deliverable tracking analysis'
    ],
    inputs: ['Sponsor engagement metrics', 'Deliverable status', 'Attendee interaction data'],
    outputs: ['Risk alerts', 'Improvement recommendations', 'ROI forecast'],
    workflow: {
      scenario: 'A Platinum sponsor booth is receiving 40% less foot traffic than historical benchmarks by mid-day.',
      steps: [
        { title: 'Monitoring', desc: 'Continuously analyzes attendee badge scan telemetry around the exhibition floor.' },
        { title: 'Anomaly Detection', desc: 'Flags the low engagement for the Platinum sponsor compared to expected tier performance.' },
        { title: 'Intervention', desc: 'Sends an alert to the Orchestrator to push a mass notification to attendees about a "Coffee Hour & Giveaway" at the sponsor booth to immediately drive traffic.' }
      ]
    }
  },
  {
    id: 'Orchestrator',
    name: 'Intelligence Engine (Orchestrator)',
    icon: <Brain className="text-cyan-400" size={32} />,
    color: 'cyan',
    description: 'The central nervous system that routes real-time telemetry data to specialized agents and compiles overall event insights.',
    capabilities: [
      'Event telemetry parsing',
      'Dynamic agent routing',
      'Insight generation',
      'Global anomaly detection'
    ],
    inputs: ['Live telemetry (scans, registrations)', 'Context Type'],
    outputs: ['Global Event Insights', 'Cross-agent recommendations'],
    workflow: {
      scenario: 'Registration queue at the main entrance is backing up rapidly, with wait times exceeding 15 minutes.',
      steps: [
        { title: 'Telemetry Parsing', desc: 'Detects high frequency of check-in attempts at Entrance A with low throughput.' },
        { title: 'Routing & Analysis', desc: 'Determines this is a "Queue Capacity" issue. Generates a global "WARNING" insight.' },
        { title: 'Cross-Agent Orchestration', desc: 'Commands Venue Agent to open Entrance B, and notifies staff via Incident Agent to redirect the overflow of attendees.' }
      ]
    }
  }
];

export default function AIAgentsDashboard() {
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [agentActions, setAgentActions] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecentActions = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/analytics/intelligence');
        const recommendations = res.data.recommendations || [];
        
        // Group recommendations by agent
        const grouped = recommendations.reduce((acc, rec) => {
          const agentId = rec.sourceAgent;
          if (!acc[agentId]) acc[agentId] = [];
          acc[agentId].push(rec);
          return acc;
        }, {});
        
        setAgentActions(grouped);
      } catch (error) {
        console.error("Error fetching agent actions", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentActions();
  }, []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 h-full">
      <div>
        <h2 className="text-4xl font-bold gradient-text pb-2">AI Agents Fleet</h2>
        <p className="text-muted-foreground">Manage and monitor the autonomous agents powering the Infosys Event Platform.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {AGENT_PROFILES.map((agent) => (
          <motion.div
            key={agent.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelectedAgent(agent)}
            className={`glass p-6 rounded-2xl cursor-pointer border-t-4 border-${agent.color}-500/50 hover:border-${agent.color}-400 transition-colors relative overflow-hidden`}
          >
            <div className="absolute -right-6 -top-6 opacity-10">
              {agent.icon}
            </div>
            
            <div className="flex items-center gap-4 mb-4">
              <div className={`p-3 rounded-lg bg-${agent.color}-500/20`}>
                {agent.icon}
              </div>
              <div>
                <h3 className="text-xl font-bold">{agent.name}</h3>
                <div className="flex items-center gap-1 text-xs text-green-400 mt-1">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                  Online
                </div>
              </div>
            </div>
            
            <p className="text-sm text-slate-300 line-clamp-3">
              {agent.description}
            </p>
            
            <div className="mt-6 flex justify-between items-center text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Activity size={14} />
                <span>{agentActions[agent.id]?.length || 0} recent actions</span>
              </div>
              <div className="text-primary hover:underline">View Details &rarr;</div>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {selectedAgent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="glass p-8 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-white/10 shadow-2xl"
            >
              <div className="flex justify-between items-start mb-8">
                <div className="flex items-center gap-4">
                   <div className={`p-4 rounded-xl bg-${selectedAgent.color}-500/20`}>
                     {selectedAgent.icon}
                   </div>
                   <div>
                     <h2 className="text-3xl font-bold">{selectedAgent.name}</h2>
                     <p className="text-muted-foreground">Agent ID: {selectedAgent.id}</p>
                   </div>
                </div>
                <button onClick={() => setSelectedAgent(null)} className="p-2 hover:bg-white/10 rounded-full transition">
                  <X size={24} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-semibold flex items-center gap-2 mb-3">
                      <Cpu size={18} className="text-primary" /> Core Function
                    </h4>
                    <p className="text-slate-300 leading-relaxed text-sm">
                      {selectedAgent.description}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="text-lg font-semibold flex items-center gap-2 mb-3">
                      <Zap size={18} className="text-yellow-400" /> Capabilities
                    </h4>
                    <ul className="space-y-2">
                      {selectedAgent.capabilities.map((cap, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-slate-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary/60"></span>
                          {cap}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="space-y-6 bg-black/30 p-5 rounded-xl border border-white/5">
                  <div>
                    <h4 className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Inputs Received</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedAgent.inputs.map((input, i) => (
                        <span key={i} className="px-2.5 py-1 rounded bg-slate-800 text-xs text-slate-300 border border-slate-700">
                          {input}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Outputs Generated</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedAgent.outputs.map((output, i) => (
                        <span key={i} className="px-2.5 py-1 rounded bg-primary/20 text-primary text-xs border border-primary/30">
                          {output}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {selectedAgent.workflow && (
                <div className="mb-8 p-6 bg-white/5 rounded-2xl border border-white/10">
                  <h4 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Activity size={20} className={`text-${selectedAgent.color}-400`} /> 
                    Example Workflow
                  </h4>
                  <div className="mb-6 bg-black/40 p-4 rounded-xl border border-white/5">
                    <p className="text-sm text-slate-300"><span className="font-semibold text-white">Scenario:</span> {selectedAgent.workflow.scenario}</p>
                  </div>
                  
                  <div className="space-y-4">
                    {selectedAgent.workflow.steps.map((step, idx) => (
                      <div key={idx} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-${selectedAgent.color}-500/20 text-${selectedAgent.color}-400 font-bold border border-${selectedAgent.color}-500/30`}>
                            {idx + 1}
                          </div>
                          {idx !== selectedAgent.workflow.steps.length - 1 && (
                            <div className={`w-0.5 h-full bg-${selectedAgent.color}-500/20 mt-2`}></div>
                          )}
                        </div>
                        <div className="pb-4 pt-1">
                          <h5 className="font-bold text-slate-100">{step.title}</h5>
                          <p className="text-sm text-slate-400 mt-1">{step.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h4 className="text-xl font-bold border-b border-white/10 pb-2 mb-4">Recent Autonomous Actions</h4>
                <div className="space-y-3">
                  {loading ? (
                    <div className="text-center py-8 text-muted-foreground animate-pulse">Loading actions...</div>
                  ) : agentActions[selectedAgent.id] && agentActions[selectedAgent.id].length > 0 ? (
                    agentActions[selectedAgent.id].map(action => (
                      <div key={action.id} className="p-4 rounded-lg bg-white/5 border border-white/10">
                        <div className="flex justify-between items-start mb-2">
                          <span className={`text-xs px-2 py-0.5 rounded font-bold ${
                              action.insight?.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-500' :
                              action.insight?.severity === 'WARNING' ? 'bg-yellow-500/20 text-yellow-500' :
                              'bg-blue-500/20 text-blue-500'
                          }`}>
                            {action.insight?.severity || 'INFO'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(action.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-slate-300 mb-1"><span className="font-semibold text-white">Insight:</span> {action.insight?.description || 'N/A'}</p>
                        <p className="text-sm text-primary"><span className="font-semibold">Action Taken:</span> {action.message}</p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground bg-black/20 rounded-xl border border-white/5">
                      No recent actions logged for this agent.
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
