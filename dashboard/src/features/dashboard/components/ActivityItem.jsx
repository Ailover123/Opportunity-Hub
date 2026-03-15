import React from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

const ActivityItem = ({ text, time, type }) => {
    const Icon = type === 'error' ? AlertCircle : CheckCircle2;
    const color = type === 'error' ? 'var(--danger)' : (type === 'success' ? 'var(--success)' : 'var(--primary)');

    return (
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <Icon size={16} color={color} />
            <div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>{text}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{time}</div>
            </div>
        </div>
    );
};

export default ActivityItem;
