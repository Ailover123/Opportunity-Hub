import React from 'react';

const MeetingItem = ({ title, time }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: '#f8fafc', borderRadius: '4px' }}>
        <div>
            <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{title}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{time}</div>
        </div>
        <button className="btn btn-outline" style={{ padding: '4px 8px' }}>Join</button>
    </div>
);

export default MeetingItem;
