import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import {
    Shield, Users, Database, Zap, Download,
    RefreshCcw, ExternalLink, Calendar, CheckCircle2,
    HardDrive, AlertCircle, LayoutDashboard, Globe

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
import MeetingItem from '../features/dashboard/components/MeetingItem';
import ActivityItem from '../features/dashboard/components/ActivityItem';
import FeatureGuard from '../components/common/FeatureGuard';

const socket = io(window.location.origin.replace('5173', '3001'), {
    withCredentials: true,
    transports: ['websocket']
});

const SaaSDashboard = () => {
    const { user, checkAuth } = useUser();
    const { addNotification } = useNotification();
    const [results, setResults] = useState([]);
    const [stats, setStats] = useState({ total: 0, verified: 0, categories: {} });
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [collecting, setCollecting] = useState(false);
    const [meetings, setMeetings] = useState([]);
    const [activities, setActivities] = useState([]);
    const [showDriveModal, setShowDriveModal] = useState(false);

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
            const [opps, meet, act] = await Promise.all([
                axios.get('/api/opportunities'),
                axios.get('/api/meetings/my-meetings'),
                axios.get('/api/notifications')
            ]);
            setResults(opps.data || []);
            setMeetings(meet.data || []);
            setActivities(act.data || []);
        } catch (err) {
            console.error('Fetch error:', err);
        } finally {
            setLoading(false);
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
                <div className="stats-grid">
                    <StatCard title="Total Collected" value={results.length.toLocaleString()} icon={<Database size={18} />} />
                    <StatCard title="Global Reach" value={results.filter(o => o.source === 'unstop').length.toLocaleString()} icon={<Globe size={18} />} />
                    <StatCard title="Sync Frequency" value={user?.plan === 'free' ? "24h" : (user?.plan === 'pro' ? "6h" : "1h")} icon={<Calendar size={18} />} />
                    <StatCard title="System Performance" value="Optimal" icon={<Zap size={18} />} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                    <div className="card">
                        <h2 className="card-title" style={{ marginBottom: '1.5rem' }}>Collection Volume Trend</h2>
                        <div style={{ width: '100%', height: 300 }}>
                            <ResponsiveContainer>
                                <AreaChart data={trendData}>
                                    <defs>
                                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Legend verticalAlign="top" height={36} />
                                    <Area type="monotone" dataKey="count" name="Opportunities" stroke="var(--primary)" fillOpacity={1} fill="url(#colorValue)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="card">
                        <h2 className="card-title" style={{ marginBottom: '1.5rem' }}>Platform Share</h2>
                        <div style={{ width: '100%', height: 300 }}>
                            <ResponsiveContainer>
                                <PieChart>
                                    <Pie
                                        data={platformData}
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {platformData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend verticalAlign="bottom" height={36} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="card-header">
                        <h2 className="card-title">Live Pipeline</h2>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button className="btn btn-outline" onClick={handleExport}>
                                <Download size={16} /> Export
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={triggerCollection}
                                disabled={collecting}
                            >
                                <RefreshCcw size={16} className={collecting ? 'animate-spin' : ''} />
                                {collecting ? 'Syncing...' : 'Sync Now'}
                            </button>
                        </div>
                    </div>

                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>OPPORTUNITY NAME</th>
                                    <th>SOURCE</th>
                                    <th>HOST</th>
                                    <th>DEADLINE</th>
                                    <th>ACTION</th>
                                </tr>
                            </thead>
                            <tbody>
                                {results.length > 0 ? results.map((item, i) => (
                                    <tr key={i}>
                                        <td style={{ fontWeight: 600 }}>{item.title}</td>
                                        <td><span className="badge badge-indigo">{getSourceLabel(item.source)}</span></td>
                                        <td>{item.organization}</td>
                                        <td>{item.deadline}</td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button
                                                    onClick={() => {
                                                        if (item.url) window.open(item.url, '_blank');
                                                        else addNotification('Source URL unavailable for this item.', 'warning');
                                                    }}
                                                    className="btn btn-outline"
                                                    style={{ padding: '4px 8px', borderColor: 'var(--primary)', color: 'var(--primary)' }}
                                                    title="View Original"
                                                >
                                                    <ExternalLink size={14} /> View Source
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>No data yet. Hit Sync to start.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    <div className="card">
                        <h2 className="card-title" style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Calendar size={18} color="var(--primary)" /> Team Syncs
                        </h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <FeatureGuard featureId="communityWrite" fallback={
                                <div
                                    onClick={() => addNotification('Team Sync is a Pro Feature', 'info')}
                                    style={{ padding: '1rem', background: '#fef2f2', border: '1px dashed #fecaca', borderRadius: '4px', fontSize: '0.875rem', cursor: 'pointer' }}
                                >
                                    Upgrade to Pro to sync your Google Calendar and join Team Syncs.
                                </div>
                            }>
                                {meetings.length > 0 ? meetings.map((m, i) => (
                                    <MeetingItem key={i} title={m.title} time={m.time} />
                                )) : (
                                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>No upcoming syncs.</div>
                                )}
                            </FeatureGuard>
                        </div>
                    </div>

                    <div className="card">
                        <h2 className="card-title" style={{ marginBottom: '1.25rem' }}>Activity Feed</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {activities.length > 0 ? activities.map((a, i) => (
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
