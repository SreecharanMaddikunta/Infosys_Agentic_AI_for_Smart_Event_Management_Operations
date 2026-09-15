import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import RecommendationsFeed from '../components/RecommendationsFeed';

export default function ExecutiveDashboard() {
    const [intelligenceData, setIntelligenceData] = useState({
        insights: [],
        recommendations: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchIntelligence = async () => {
            try {
                const res = await axios.get('http://localhost:5000/api/analytics/intelligence');
                setIntelligenceData(res.data);
            } catch (error) {
                console.error("Error fetching intelligence data", error);
            } finally {
                setLoading(false);
            }
        };

        // Initial fetch
        fetchIntelligence();

        // HTTP Polling mechanism - refresh every 10 seconds
        const intervalId = setInterval(fetchIntelligence, 10000);
        return () => clearInterval(intervalId);
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary"></div>
            </div>
        );
    }

    const { insights, recommendations } = intelligenceData;

    const handleAction = async (id, status) => {
        try {
            await axios.put(`http://localhost:5000/api/analytics/recommendations/${id}`, { status });
            // Remove the recommendation from local state for immediate feedback
            setIntelligenceData(prev => ({
                ...prev,
                recommendations: prev.recommendations.filter(r => r.id !== id)
            }));
        } catch (error) {
            console.error("Error updating recommendation", error);
        }
    };

    const handleGenerateMock = async () => {
        try {
            await axios.post('http://localhost:5000/api/analytics/trigger-mock');
            // Re-fetch intelligence after generating mock
            const res = await axios.get('http://localhost:5000/api/analytics/intelligence');
            setIntelligenceData(res.data);
        } catch (error) {
            console.error("Error generating mock intelligence", error);
            alert("Failed to generate mock data. Ensure backend is running and events exist.");
        }
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 h-full flex flex-col">
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-4xl font-bold gradient-text pb-2">Executive Command Center</h2>
                    <p className="text-muted-foreground">Real-time event intelligence and automated recommendations.</p>
                </div>
                <button 
                    onClick={handleGenerateMock}
                    className="px-4 py-2 bg-primary/20 text-primary border border-primary/30 rounded hover:bg-primary/30 transition shadow-[0_0_15px_rgba(30,144,255,0.2)]"
                >
                    Test: Generate Insights
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1">
                {/* Left Column: Raw Insights Feed */}
                <div className="lg:col-span-1 glass p-6 rounded-2xl shadow-xl flex flex-col h-full max-h-[600px]">
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <span>📡</span> Live Event Insights
                    </h3>
                    
                    <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                        {insights.length > 0 ? (
                            insights.map((insight) => (
                                <div key={insight.id} className="bg-secondary/40 p-4 rounded-lg border border-white/5">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className={`text-xs px-2 py-0.5 rounded font-bold ${
                                            insight.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-500' :
                                            insight.severity === 'WARNING' ? 'bg-yellow-500/20 text-yellow-500' :
                                            'bg-blue-500/20 text-blue-500'
                                        }`}>
                                            {insight.severity}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            {new Date(insight.createdAt).toLocaleTimeString()}
                                        </span>
                                    </div>
                                    <p className="text-sm font-semibold">{insight.event?.title}</p>
                                    <p className="text-sm text-muted-foreground mt-1">{insight.description}</p>
                                </div>
                            ))
                        ) : (
                            <p className="text-center text-muted-foreground mt-10">No insights recorded yet.</p>
                        )}
                    </div>
                </div>

                {/* Right Columns: AI Recommendations (The Actionable Part) */}
                <div className="lg:col-span-2">
                    <RecommendationsFeed recommendations={recommendations} onAction={handleAction} />
                </div>
            </div>
        </motion.div>
    );
}
