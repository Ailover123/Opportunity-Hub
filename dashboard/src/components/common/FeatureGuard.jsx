import React from 'react';
import { useFeatureAccess } from '../../hooks/useFeatureAccess';
import { Zap, ShieldAlert } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';

const FeatureGuard = ({ featureId, children, fallback = null, showUpgradeCTA = true }) => {
    const { checkAccess } = useFeatureAccess();
    const { addNotification } = useNotification();
    const hasAccess = checkAccess(featureId);

    if (hasAccess) return children;

    const handleUpgradeClick = () => {
        addNotification(`Upgrade to unlock this feature!`, 'info');
    };

    if (fallback) return fallback;

    if (!showUpgradeCTA) return null;

    return (
        <div className="feature-locked-placeholder" onClick={handleUpgradeClick} style={{
            padding: '1.5rem',
            border: '1px dashed #cbd5e1',
            borderRadius: '8px',
            background: '#f8fafc',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            cursor: 'pointer',
            textAlign: 'center'
        }}>
            <ShieldAlert size={24} color="#94a3b8" />
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#64748b' }}>
                This feature is locked on your current plan
            </div>
            <button className="btn btn-primary" style={{ fontSize: '0.75rem', padding: '0.5rem 1rem' }}>
                <Zap size={14} /> Upgrade Now
            </button>
        </div>
    );
};

export default FeatureGuard;
