import React from 'react';

const MessageItem = ({ msg }) => (
    <div style={{ display: 'flex', gap: '1rem' }}>
        <div style={{ width: 36, height: 36, borderRadius: '6px', background: '#e2e8f0', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8' }}>
            {msg.user_name?.charAt(0)}
        </div>
        <div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'baseline', marginBottom: '0.25rem' }}>
                <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>{msg.user_name}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{new Date(msg.created_at).toLocaleTimeString()}</span>
            </div>
            <p style={{ fontSize: '0.9375rem', color: '#334155', lineHeight: 1.5 }}>{msg.content}</p>
        </div>
    </div>
);

export default MessageItem;
