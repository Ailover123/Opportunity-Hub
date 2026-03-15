import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { MessageSquare, Users, PlusCircle, Paperclip, Send, Search } from 'lucide-react';
import axios from '../utils/api';
import { useNotification } from '../context/NotificationContext';

// Feature components
import TeamSidebar from '../features/community/components/TeamSidebar';
import ChatArea from '../features/community/components/ChatArea';
import FeatureGuard from '../components/common/FeatureGuard';

const CommunityHub = () => {
    const { user } = useUser();
    const { addNotification } = useNotification();

    const [teams, setTeams] = useState([]);
    const [activeTeam, setActiveTeam] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');

    useEffect(() => {
        if (user) fetchTeams();
    }, [user]);

    useEffect(() => {
        if (activeTeam) fetchMessages(activeTeam.id);
    }, [activeTeam]);

    const fetchTeams = async () => {
        try {
            const { data } = await axios.get('/api/community/my-teams');
            setTeams(data);
            if (data.length > 0) setActiveTeam(data[0]);
        } catch (e) { console.error(e); }
    };

    const fetchMessages = async (teamId) => {
        try {
            const { data } = await axios.get(`/api/community/discussions/${teamId}`);
            setMessages(data);
        } catch (e) { console.error(e); }
    };

    const sendMessage = async () => {
        if (!newMessage.trim() || !activeTeam) return;
        try {
            await axios.post('/api/community/discussions', {
                team_id: activeTeam.id,
                content: newMessage
            });
            setNewMessage('');
            fetchMessages(activeTeam.id);
        } catch (e) { console.error(e); }
    };

    if (user?.plan === 'free') {
        return (
            <div className="main-wrapper">
                <div className="content-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
                    <div className="card" style={{ maxWidth: 500, textAlign: 'center', padding: '3rem' }}>
                        <Users size={48} color="var(--primary)" style={{ margin: '0 auto 1.5rem' }} />
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>Team Collaboration</h2>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                            Upgrade to a Team plan to build private workspaces, share real-time analytics, and coordinate hackathon submissions.
                        </p>
                        <button
                            className="btn btn-primary"
                            style={{ padding: '0.75rem 2rem' }}
                            onClick={() => addNotification('Team Upgrade portal is opening soon! Contact sales for early access.', 'info')}
                        >
                            Upgrade to Team
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="main-wrapper" style={{ height: '100vh', overflow: 'hidden' }}>
            <header className="header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <h1 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Community</h1>
                </div>
            </header>

            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                <TeamSidebar teams={teams} activeTeam={activeTeam} setActiveTeam={setActiveTeam} />
                
                {activeTeam ? (
                    <ChatArea 
                        activeTeam={activeTeam} 
                        messages={messages} 
                        newMessage={newMessage} 
                        setNewMessage={setNewMessage} 
                        sendMessage={sendMessage} 
                    />
                ) : (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                        Select a workspace to start collaborating
                    </div>
                )}
            </div>
        </div>
    );
};

export default CommunityHub;
