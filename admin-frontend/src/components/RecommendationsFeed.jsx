import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function RecommendationsFeed({ recommendations, onAction }) {
    if (!recommendations || recommendations.length === 0) {
        return (
            <div className="glass p-6 rounded-2xl shadow-xl flex flex-col h-full justify-center items-center text-muted-foreground">
                <span className="text-4xl mb-4">✅</span>
                <p>System Operating Normally.</p>
                <p className="text-sm">No active AI recommendations at this time.</p>
            </div>
        );
    }

    return (
        <div className="glass p-6 rounded-2xl shadow-xl flex flex-col h-full max-h-[600px]">
            <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <span className="text-accent">🧠</span> AI Recommendations
            </h3>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                <AnimatePresence>
                    {recommendations.map((rec, idx) => (
                        <motion.div
                            key={rec.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ delay: idx * 0.1 }}
                            className="bg-card border border-accent/20 p-4 rounded-xl shadow-md relative overflow-hidden"
                        >
                            {/* Decorative accent bar */}
                            <div className="absolute top-0 left-0 w-1 h-full bg-accent"></div>
                            
                            <div className="flex justify-between items-start ml-2">
                                <div>
                                    <div className="text-sm text-muted-foreground flex items-center gap-2 mb-1">
                                        <span className="bg-primary/20 text-primary px-2 py-0.5 rounded text-xs font-bold">
                                            {rec.sourceAgent || 'Orchestrator'}
                                        </span>
                                        <span>{new Date(rec.createdAt).toLocaleTimeString()}</span>
                                    </div>
                                    <h4 className="font-bold text-foreground text-lg mb-2">
                                        {rec.event?.title}
                                    </h4>
                                    <p className="text-foreground/90 leading-relaxed text-sm">
                                        {rec.message}
                                    </p>
                                </div>
                            </div>
                            
                            <div className="mt-4 ml-2 flex gap-3">
                                <button onClick={() => onAction(rec.id, 'IMPLEMENTED')} className="bg-accent hover:bg-accent/80 text-background font-bold py-1.5 px-4 rounded transition-colors text-sm">
                                    Approve Action
                                </button>
                                <button onClick={() => onAction(rec.id, 'DISMISSED')} className="bg-secondary hover:bg-secondary/80 text-foreground py-1.5 px-4 rounded transition-colors text-sm">
                                    Dismiss
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}
