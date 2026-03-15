import React from 'react';

const StatCard = ({ title, value, delta, icon }) => (
    <div className="card" style={{ marginBottom: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</span>
            {icon}
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{value}</div>
            {delta && <span style={{ fontSize: '0.75rem', color: delta.startsWith('+') ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>{delta}</span>}
        </div>
    </div>
);

export default StatCard;
