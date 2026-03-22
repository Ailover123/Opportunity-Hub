import React from 'react';
import { User, Camera } from 'lucide-react';

const AvatarSection = ({ avatarUrl, name, email, isEditing }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginBottom: '2.5rem', padding: '0.5rem' }}>
        <div style={{ position: 'relative' }}>
            <div style={{
                width: 100, height: 100, borderRadius: '50%',
                background: 'var(--bg-app)', border: '2px solid var(--border-light)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden'
            }}>
                {avatarUrl ? (
                    <img src={avatarUrl} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                    <User size={48} color="var(--text-secondary)" />
                )}
            </div>
            {isEditing && (
                <button type="button" style={{
                    position: 'absolute', bottom: 0, right: 0,
                    width: 32, height: 32, borderRadius: '50%',
                    background: 'white', border: '1px solid var(--border-light)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer'
                }}>
                    <Camera size={16} color="var(--primary)" />
                </button>
            )}
        </div>
        <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.25rem' }}>{name || 'Anonymous User'}</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{email}</p>
        </div>
    </div>
);

export default AvatarSection;
