import React from 'react';

const ProfileField = ({ label, value, editing, onChange, placeholder, icon }) => (
    <div style={{ flex: 1 }}>
        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', marginBottom: '0.75rem' }}>{label}</label>
        {editing ? (
            <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>{icon}</div>
                <input
                    type="text"
                    className="btn btn-outline"
                    style={{ width: '100%', paddingLeft: '2.5rem', textAlign: 'left', cursor: 'text' }}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                />
            </div>
        ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', height: '42px', color: 'var(--text-primary)', fontWeight: 500 }}>
                <span style={{ color: '#94a3b8' }}>{icon}</span>
                {value || <span style={{ color: '#94a3b8', fontWeight: 400 }}>Not set</span>}
            </div>
        )}
    </div>
);

export default ProfileField;
