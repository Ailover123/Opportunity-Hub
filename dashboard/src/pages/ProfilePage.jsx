import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { User, Mail, Github, Award, Save, RefreshCw, Camera, AlertCircle, CheckCircle2 } from 'lucide-react';
import axios from '../utils/api';
import { useNotification } from '../context/NotificationContext';

// Modular Components
import ProfileField from '../features/profile/components/ProfileField';
import AvatarSection from '../features/profile/components/AvatarSection';
import SecuritySection from '../features/profile/components/SecuritySection';

const ProfilePage = () => {
    const { user, checkAuth } = useUser();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const { addNotification } = useNotification();

    const [formData, setFormData] = useState({
        name: '',
        bio: '',
        skills: '',
        github_url: '',
        avatar_url: ''
    });

    useEffect(() => {
        if (user) {
            fetchProfile();
        }
    }, [user]);

    const fetchProfile = async () => {
        setLoading(true);
        try {
            const { data } = await axios.get('/api/profile');
            setFormData({
                name: data.name || user?.name || '',
                bio: data.bio || '',
                skills: data.skills || '',
                github_url: data.github_url || '',
                avatar_url: data.avatar_url || ''
            });

        } catch (err) {
            console.error('Failed to fetch profile:', err);
        } finally {
            setLoading(false);
        }
    };


    const handleSave = async (e) => {
        if (e) e.preventDefault();
        setSaving(true);
        try {
            await axios.put('/api/profile', formData);
            addNotification('Profile updated successfully!', 'success');
            await checkAuth(); // Refresh global user state
            setIsEditing(false);
        } catch (err) {
            addNotification(err.response?.data?.error || 'Failed to update profile', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="main-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)' }}>
                <RefreshCw className="animate-spin" size={20} />
                <span>Synchronizing Profile...</span>
            </div>
        </div>
    );

    return (
        <div className="main-wrapper">
            <header className="header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <h1 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Profile Identity</h1>
                    <span className="badge badge-indigo" style={{ fontSize: '0.65rem' }}>{user?.plan} access</span>
                </div>
                {!isEditing ? (
                    <button onClick={() => setIsEditing(true)} className="btn btn-primary" style={{ padding: '0.5rem 1.25rem' }}>
                        <RefreshCw size={16} /> Edit Profile
                    </button>
                ) : (
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button onClick={() => setIsEditing(false)} className="btn btn-outline">Cancel</button>
                        <button onClick={handleSave} disabled={saving} className="btn btn-primary">
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                )}
            </header>

            <div className="content-body" style={{ maxWidth: '800px' }}>
                <div className="card">
                    <AvatarSection 
                        avatarUrl={formData.avatar_url} 
                        name={formData.name} 
                        email={user?.email} 
                        isEditing={isEditing} 
                    />

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                        <ProfileField
                            label="Full Name"
                            value={formData.name}
                            editing={isEditing}
                            onChange={(val) => setFormData({ ...formData, name: val })}
                            placeholder="Your professional name"
                            icon={<User size={16} />}
                        />

                        <ProfileField
                            label="Email Address"
                            value={user?.email}
                            editing={false}
                            placeholder="Email address"
                            icon={<Mail size={16} />}
                        />

                        <div style={{ gridColumn: 'span 2' }}>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', marginBottom: '0.75rem' }}>Professional Bio</label>
                            {isEditing ? (
                                <textarea
                                    className="btn btn-outline"
                                    style={{ width: '100%', minHeight: '120px', textAlign: 'left', cursor: 'text', padding: '1rem', lineHeight: '1.6' }}
                                    value={formData.bio}
                                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                    placeholder="Tell the community about your expertise and goals..."
                                />
                            ) : (
                                <div style={{ minHeight: '60px', color: 'var(--text-primary)', fontSize: '0.95rem', lineHeight: '1.6' }}>
                                    {formData.bio || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>No bio provided yet. Click edit to add one.</span>}
                                </div>
                            )}
                        </div>

                        <ProfileField
                            label="Skills"
                            value={formData.skills}
                            editing={isEditing}
                            onChange={(val) => setFormData({ ...formData, skills: val })}
                            placeholder="React, Python, Figma..."
                            icon={<Award size={16} />}
                        />

                        <ProfileField
                            label="GitHub Profile"
                            value={formData.github_url}
                            editing={isEditing}
                            onChange={(val) => setFormData({ ...formData, github_url: val })}
                            placeholder="https://github.com/username"
                            icon={<Github size={16} />}
                        />
                    </div>
                </div>

                {isEditing && (
                    <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                        <button onClick={() => setIsEditing(false)} className="btn btn-outline" style={{ padding: '0.75rem 2rem' }}>Cancel</button>
                        <button
                            onClick={handleSave}
                            className="btn btn-primary"
                            disabled={saving}
                            style={{ padding: '0.75rem 2.5rem' }}
                        >
                            <Save size={18} /> {saving ? 'Saving...' : 'Save Profile'}
                        </button>
                    </div>
                )}

                {!isEditing && (
                    <SecuritySection onResetPassword={() => addNotification('Encrypted reset link dispatched!', 'success')} />
                )}
            </div>
        </div>
    );
};

export default ProfilePage;
