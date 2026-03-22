import React from 'react';
import { ExternalLink, CheckCircle2, ChevronRight, Award, Clock, Activity, AlertCircle, Globe } from 'lucide-react';
import { motion } from 'framer-motion';

import axios from '../../../utils/api';

const RankedList = ({ opportunities, onStatusUpdate, loading }) => {
    
    const handleApplyClick = async (opp, index) => {
        window.open(opp.url, '_blank');
        
        // Capture skipped items (rank < current rank)
        const skipped_items = opportunities.slice(0, index).map(o => o.id);

        try {
            await axios.post(`/api/opportunities/${opp.id}/click`, {
                score: opp.score,
                reasons: opp.reasons,
                rank: index + 1,
                skipped_items
            });
        } catch (err) {
            console.error('Failed to log click:', err);
        }
    };
    if (loading) {
        return (
            <div className="flex flex-col gap-4">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse bg-slate-100 h-32 rounded-xl" />
                ))}
            </div>
        );
    }

    if (!opportunities || opportunities.length === 0) {
        return (
            <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                <AlertCircle className="mx-auto mb-4 text-slate-400" size={48} />
                <h3 className="text-lg font-semibold text-slate-700">No opportunities found</h3>
                <p className="text-slate-500">Try syncing or updating your search profile.</p>
            </div>
        );
    }

    const getIcon = (type) => {
        switch (type) {
            case 'skill': return <Award size={14} className="text-indigo-500" />;
            case 'deadline': return <Clock size={14} className="text-orange-500" />;
            case 'platform': return <Activity size={14} className="text-emerald-500" />;
            default: return <ChevronRight size={14} />;
        }
    };

    return (
        <div className="flex flex-col gap-6">
            {opportunities.map((opp, index) => (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    key={opp.id}
                    className={`relative p-6 rounded-2xl border-2 transition-all hover:shadow-lg ${
                        index === 0 ? 'border-indigo-200 bg-indigo-50/30' : 'border-slate-100 bg-white'
                    }`}
                >
                    {index === 0 && (
                        <div className="absolute -top-3 left-6 px-3 py-1 bg-indigo-600 text-white text-xs font-bold rounded-full shadow-lg">
                            TOP MATCH
                        </div>
                    )}

                    <div className="flex flex-col md:flex-row justify-between gap-4">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-xl font-bold text-slate-900">{opp.title}</h3>
                                {opp.score && (
                                    <div className="px-2 py-1 bg-slate-900 text-white text-xs font-mono rounded-md">
                                        MATCH: {opp.score}/10
                                    </div>
                                )}
                            </div>
                            
                            <p className="text-slate-600 font-medium mb-4">{opp.organization}</p>
                            
                            <div className="flex flex-wrap gap-2 mb-6">
                                {opp.reasons?.map((reason, i) => (
                                    <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 shadow-sm">
                                        {getIcon(reason.type)}
                                        {reason.message}
                                    </div>
                                ))}
                            </div>

                            <div className="flex flex-wrap items-center gap-6 text-sm text-slate-500">
                                <span className="flex items-center gap-2">
                                    <Clock size={16} />
                                    {opp.deadline || 'Ongoing'}
                                </span>
                                <span className="flex items-center gap-2">
                                    <Globe size={16} />
                                    {opp.location || 'Distributed'}
                                </span>
                                <span className="flex items-center gap-2 capitalize">
                                    <Activity size={16} />
                                    {opp.source}
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row md:flex-col justify-center gap-3 w-full md:w-48">
                            <button
                                onClick={() => handleApplyClick(opp, index)}
                                className="flex items-center justify-center gap-2 w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors"
                            >
                                <ExternalLink size={18} /> Apply Now
                            </button>
                            
                            <button
                                onClick={() => onStatusUpdate(opp.id, opp.status === 'applied' ? 'pending' : 'applied', opp.score, opp.reasons, index + 1)}
                                className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold border-2 transition-all ${
                                    opp.status === 'applied' 
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                                    : 'border-slate-200 text-slate-600 hover:border-slate-300'
                                }`}
                            >
                                <CheckCircle2 size={18} /> 
                                {opp.status === 'applied' ? 'Applied' : 'Mark Applied'}
                            </button>
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
    );
};

export default RankedList;
