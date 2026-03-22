import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import {
    Shield, Users, Database, Zap, Download,
    RefreshCcw, ExternalLink, Calendar, CheckCircle2,
    HardDrive, AlertCircle, LayoutDashboard, Globe, Award
} from 'lucide-react';

import { useNotification } from '../context/NotificationContext';
import { motion, AnimatePresence } from 'framer-motion';
import axios from '../utils/api';
import { io } from 'socket.io-client';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    AreaChart, Area, PieChart, Pie, Cell, Legend
} from 'recharts';

// Feature-based components
import StatCard from '../features/dashboard/components/StatCard';
import ActivityItem from '../features/dashboard/components/ActivityItem';
import FeatureGuard from '../components/common/FeatureGuard';
import RankedList from '../features/opportunities/components/RankedList';

const socket = io(window.location.origin.replace('5173', '3001'), {
    withCredentials: true,
    transports: ['websocket']
});

const SaaSDashboard = () => {
    const { user, checkAuth } = useUser();
    const { addNotification } = useNotification();
    const [results, setResults] = useState([]);
    const [stats, setStats] = useState({ total: 0, topScore: 0 });
    const [loading, setLoading] = useState(true);
    const [isRanked, setIsRanked] = useState(false);
    const [fallbackMessage, setFallbackMessage] = useState('');
    const [collecting, setCollecting] = useState(false);
    const [showIntent, setShowIntent] = useState(null); // { id, score, reasons, rank }
    const [activities, setActivities] = useState([]);
    const [showDriveModal, setShowDriveModal] = useState(false);
    const [locationFilter, setLocationFilter] = useState('all'); // 'all', 'online', 'physical'

    useEffect(() => {
        if (user) {
            fetchDashboardData();

            // Join user-specific socket room
            socket.emit('join_team', user.id); // Reusing join_team for user room

            socket.on('worker_status', (data) => {
                console.log('[Socket] Progress:', data);
                if (data.status === 'completed' || data.status === 'failed') {
                    setCollecting(false);
                }
                addNotification(data.message, data.status === 'completed' ? 'success' : (data.status === 'failed' ? 'error' : 'info'));
                if (data.status === 'completed') {
                    fetchDashboardData();
                }
            });
        }
        return () => socket.off('worker_status');
    }, [user]);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const [opps, act] = await Promise.all([
                axios.get('/api/opportunities/ranked'),
                axios.get('/api/notifications')
            ]);
            
            setResults(opps.data.data || []);
            setIsRanked(opps.data.isRanked);
            setFallbackMessage(opps.data.fallbackMessage);
            
            // Calculate stats
            const topScore = (opps.data.data && opps.data.data.length > 0) ? (opps.data.data[0].score || 0) : 0;
            setStats({
                total: opps.data.data ? opps.data.data.length : 0,
                topScore: topScore
            });

            setActivities(act.data || []);
        } catch (err) {
            console.error('Fetch error:', err);
            addNotification('Failed to fetch intelligence data', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id, status, score, reasons, rank) => {
        try {
            await axios.patch(`/api/opportunities/${id}/status`, { status, score, reasons, rank });
            setResults(prev => prev.map(o => o.id === id ? { ...o, status } : o));
            
            if (status === 'applied') {
                setShowIntent({ id, score, reasons, rank });
                // Auto-hide after 10s if no interaction
                setTimeout(() => setShowIntent(null), 10000);
            }
            
            addNotification(status === 'applied' ? 'Marked as Applied!' : 'Status updated', 'success');
        } catch (err) {
            addNotification('Update failed', 'error');
        }
    };

    const submitIntent = async (tag) => {
        if (!showIntent) return;
        try {
            await axios.patch(`/api/opportunities/${showIntent.id}/status`, { 
                status: 'applied',
                score: showIntent.score,
                reasons: showIntent.reasons,
                rank: showIntent.rank,
                intent_tag: tag 
            });
            setShowIntent(null);
            addNotification('Feedback captured!', 'success');
        } catch (err) {
            console.error(err);
        }
    };

    const triggerCollection = async () => {
        setCollecting(true);
        try {
            await axios.post('/api/collect');
        } catch (err) {
            addNotification(err.response?.data?.error || 'Collection failed', 'error');
            setCollecting(false);
        }
    };

    const handleExport = async () => {
        try {
            addNotification('Preparing export...', 'info');
            const { data } = await axios.post('/api/export');
            if (data.downloadUrl) {
                const backendOrigin = window.location.origin.replace('5173', '3001');
                const downloadLink = `${backendOrigin}${data.downloadUrl}`;
                window.open(downloadLink, '_blank');
                addNotification('Export ready! Downloading...', 'success');
            }

        } catch (err) {
            addNotification('Export failed: ' + (err.response?.data?.error || err.message), 'error');
        }
    };

    const formatTime = (dateStr) => {
        if (!dateStr) return 'Pending...';
        const date = new Date(dateStr.includes('Z') ? dateStr : dateStr.replace(' ', 'T') + 'Z');
        return new Intl.DateTimeFormat('en-IN', {
            hour: '2-digit', minute: '2-digit', hour12: true, day: 'numeric', month: 'short'
        }).format(date);
    };

    const getSourceLabel = (src) => {
        const s = src?.toLowerCase();
        if (s === 'unstop') return 'Global Reach';
        if (s === 'kaggle') return 'Kaggle Node';
        if (s === 'devpost') return 'Devpost Engine';
        return src?.charAt(0).toUpperCase() + src?.slice(1);
    };

    const platformData = Object.entries(
        results.reduce((acc, curr) => {
            const label = getSourceLabel(curr.source);
            acc[label] = (acc[label] || 0) + 1;
            return acc;
        }, {})
    ).map(([name, value]) => ({ name, value }));

    const trendData = Object.entries(
        results.reduce((acc, curr) => {
            const date = curr.collected_at ? curr.collected_at.split(' ')[0] : 'N/A';
            acc[date] = (acc[date] || 0) + 1;
            return acc;
        }, {})
    ).sort().map(([date, count]) => ({ date, count }));

    const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444'];

    const planBadgeClass = {
        free: 'badge-slate', pro: 'badge-indigo', team: 'badge-warning'
    }[user?.plan || 'free'];

    if (loading && results.length === 0) return <div className="main-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading System Node...</div>;

    return (
        <div className="main-wrapper">
            <header className="header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <LayoutDashboard size={20} color="var(--primary)" />
                    <h1 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Intelligent Dashboard</h1>
                    <span className="badge badge-slate" style={{ fontSize: '0.65rem' }}>v2.5.0-stable</span>
                </div>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <FeatureGuard featureId="autoSync" showUpgradeCTA={false}>
                        <button
                            onClick={() => setShowDriveModal(true)}
                            className="btn btn-outline"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}
                        >
                            <HardDrive size={16} color="var(--success)" />
                            Drive Active
                        </button>
                    </FeatureGuard>
                    
                    {user?.plan === 'free' && (
                         <button
                            onClick={() => setShowDriveModal(true)}
                            className="btn btn-outline"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}
                        >
                            <HardDrive size={16} color="var(--primary)" />
                            Connect to Drive
                        </button>
                    )}

                    <span className={`badge ${planBadgeClass}`}>{user?.plan || 'free'} tier</span>
                </div>
            </header>

            {/* Drive Connection Info Modal */}
            <AnimatePresence>
                {showDriveModal && (
                    <div className="modal-overlay" onClick={() => setShowDriveModal(false)} style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)'
                    }}>
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="card"
                            style={{ maxWidth: '450px', width: '90%', padding: '2rem', textAlign: 'center' }}
                        >
                            <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                                <HardDrive size={32} color="var(--primary)" />
                            </div>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>Google Drive Integration</h2>
                            <div style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: '1.6' }}>
                                Unlock the power of automated workflows! Syncing your Google Drive allows the system to:
                                <ul style={{ textAlign: 'left', marginTop: '1rem', fontSize: '0.9rem' }}>
                                    <li>Automate data exports directly to your folders.</li>
                                    <li>Store detailed scraper logs securely.</li>
                                    <li>Enable real-time collaboration with your team.</li>
                                </ul>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <FeatureGuard featureId="autoSync" fallback={
                                    <button
                                        className="btn btn-primary"
                                        onClick={() => {
                                            setShowDriveModal(false);
                                            addNotification('Redirecting to Upgrade Page...', 'info');
                                        }}
                                    >
                                        <Zap size={18} /> Upgrade to Pro to Connect
                                    </button>
                                }>
                                    <button className="btn btn-primary">Sync Now</button>
                                </FeatureGuard>
                                <button className="btn btn-outline" onClick={() => setShowDriveModal(false)}>Maybe Later</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <div className="content-body">
                <AnimatePresence>
                    {showIntent && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 50 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 50 }}
                            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white p-6 rounded-3xl shadow-2xl flex flex-col gap-4 border border-slate-700"
                        >
                            <div className="text-center font-bold">Why did you choose this?</div>
                            <div className="flex flex-wrap gap-2 justify-center">
                                {['Better Fit', 'Easier to Apply', 'Top Brand', 'Near Deadline'].map(tag => (
                                    <button 
                                        key={tag}
                                        onClick={() => submitIntent(tag)}
                                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-sm font-medium transition-colors"
                                    >
                                        {tag}
                                    </button>
                                ))}
                                <button 
                                    onClick={() => setShowIntent(null)}
                                    className="px-4 py-2 bg-slate-700 rounded-xl text-sm font-medium"
                                >
                                    Dismiss
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {!isRanked && (
                    <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-orange-50 border-2 border-orange-200 p-4 rounded-2xl mb-8 flex items-center gap-4"
                    >
                        <AlertCircle className="text-orange-500" />
                        <div className="flex-1">
                            <p className="text-orange-900 font-bold">{fallbackMessage || "Personalized ranking is inactive."}</p>
                            <p className="text-orange-700 text-sm">Update your profile skills to see ranked opportunities.</p>
                        </div>
                        <button 
                            onClick={() => window.location.href = '/profile'}
                            className="px-4 py-2 bg-orange-500 text-white rounded-xl font-bold text-sm shadow-md"
                        >
                            Complete Profile
                        </button>
                    </motion.div>
                )}

                <div className="stats-grid">
                    <StatCard title="Priority Opportunities" value={stats.total} icon={<Database size={18} />} />
                    <StatCard title="Best Match Score" value={`${stats.topScore}/10`} icon={<Award size={18} />} />
                    <StatCard title="Applied Today" value={results.filter(o => o.status === 'applied').length} icon={<CheckCircle2 size={18} />} />
                    <StatCard title="System Node" value="Optimal" icon={<Zap size={18} />} />
                </div>

                <div className="card mb-8">
                    <div className="card-header border-b border-slate-100 pb-6 mb-8">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900">Recommended for You</h2>
                            <p className="text-slate-500 text-sm mt-1">AI-driven prioritization based on your engineering profile</p>
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                            <div className="flex bg-slate-100 p-1 rounded-xl">
                                <button 
                                    onClick={() => setLocationFilter('all')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${locationFilter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    All
                                </button>
                                <button 
                                    onClick={() => setLocationFilter('online')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${locationFilter === 'online' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    Online
                                </button>
                                <button 
                                    onClick={() => setLocationFilter('physical')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${locationFilter === 'physical' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    Offline
                                </button>
                            </div>

                            <button
                                className="btn btn-primary"
                                onClick={triggerCollection}
                                disabled={collecting}
                            >
                                <RefreshCcw size={16} className={collecting ? 'animate-spin' : ''} />
                                {collecting ? 'Detecting Shifts...' : 'Sync Intel'}
                            </button>
                        </div>
                    </div>

                    <RankedList 
                        opportunities={results.filter(opp => {
                            if (locationFilter === 'all') return true;
                            if (locationFilter === 'online') return opp.location?.toLowerCase().includes('online');
                            if (locationFilter === 'physical') return !opp.location?.toLowerCase().includes('online');
                            return true;
                        })} 
                        loading={loading} 
                        onStatusUpdate={handleStatusUpdate} 
                    />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
                    <div className="card">
                        <h2 className="card-title" style={{ marginBottom: '1.25rem' }}>Opportunity Intelligence Log</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {activities.length > 0 ? activities.slice(0, 5).map((a, i) => (
                                <ActivityItem key={i} text={a.message} time={formatTime(a.created_at)} type={a.type} />
                            )) : (
                                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>System quiet. No recent alerts.</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SaaSDashboard;
