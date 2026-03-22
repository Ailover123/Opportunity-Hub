import React, { useEffect, useState } from 'react';
import axios from '../utils/api';
import { BarChart2, MousePointer2, CheckCircle, Timer, TrendingUp } from 'lucide-react';

const DebugAnalytics = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await axios.get('/api/analytics/summary');
                setStats(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return <div className="p-8 text-slate-500">Loading Intelligence Metrics...</div>;
    if (!stats) return <div className="p-8 text-red-500">Failed to load analytics.</div>;

    const metrics = [
        { label: 'Total Clicks', value: stats.clicks, icon: <MousePointer2 />, color: 'text-indigo-600' },
        { label: 'Applications', value: stats.applied, icon: <CheckCircle />, color: 'text-emerald-600' },
        { label: 'Conv. Rate', value: `${stats.conversionRate?.toFixed(1)}%`, icon: <TrendingUp />, color: 'text-amber-600' },
        { label: 'Decision Time', value: `${stats.decisionTimeMinutes || 0}m`, icon: <Timer />, color: 'text-slate-600' },
        { label: 'Avg App. Score', value: `${stats.avgAppliedScore?.toFixed(1)}/10`, icon: <BarChart2 />, color: 'text-blue-600' },
    ];

    return (
        <div className="p-8 bg-slate-50 min-h-screen">
            <h1 className="text-3xl font-bold text-slate-900 mb-8 flex items-center gap-3">
                <BarChart2 className="text-indigo-600" size={32} />
                Internal System Intelligence
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-12">
                {metrics.map((m, i) => (
                    <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <div className={`mb-4 ${m.color}`}>{m.icon}</div>
                        <div className="text-slate-500 text-sm font-medium">{m.label}</div>
                        <div className="text-2xl font-bold text-slate-900">{m.value}</div>
                    </div>
                ))}
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 mb-12">
                <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <TrendingUp className="text-indigo-600" size={20} />
                    Click Distribution by Rank
                </h2>
                <div className="flex items-end gap-2 h-48 border-b border-l border-slate-100 p-4">
                    {[1,2,3,4,5,6,7,8,9,10].map(r => {
                        const count = stats.rankDistribution?.find(d => d.rank_at_time === r)?.count || 0;
                        const height = stats.clicks > 0 ? (count / stats.clicks) * 100 : 0;
                        return (
                            <div key={r} className="flex-1 flex flex-col items-center gap-2 group">
                                <div className="w-full bg-slate-50 rounded-t-lg relative transition-all group-hover:bg-indigo-50" style={{ height: '100%' }}>
                                    <div 
                                        className="absolute bottom-0 w-full bg-indigo-500 rounded-t-lg transition-all" 
                                        style={{ height: `${height}%` }}
                                    >
                                        {count > 0 && <span className="absolute -top-6 w-full text-center text-xs font-bold text-indigo-600">{count}</span>}
                                    </div>
                                </div>
                                <span className="text-[10px] font-bold text-slate-400">R{r}</span>
                            </div>
                        );
                    })}
                </div>
                <p className="text-xs text-slate-400 mt-4 italic">
                    Note: If "R1" is disproportionately high, check for "Laziness Bias." If "R5-10" are high, the ranking algorithm is failing.
                </p>
            </div>

            <div className="bg-indigo-900 text-indigo-100 p-8 rounded-3xl shadow-xl">
                <h2 className="text-xl font-bold mb-4">Observation Protocol</h2>
                <ul className="space-y-3 opacity-90 text-sm">
                    <li>• If <b>Avg Applied Score</b> is &lt; 7.0, the ranking is failing to highlight true value.</li>
                    <li>• If <b>Decision Time</b> is &gt; 15m, the UI is too noisy for rapid decision making.</li>
                    <li>• If <b>Conv. Rate</b> is &lt; 10%, the opportunities are attractive but not relevant enough to act.</li>
                </ul>
            </div>
        </div>
    );
};

export default DebugAnalytics;
