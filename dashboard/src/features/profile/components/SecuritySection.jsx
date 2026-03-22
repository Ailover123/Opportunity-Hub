import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

const SecuritySection = ({ onResetPassword }) => (
    <div className="card" style={{ marginTop: '2rem', borderLeft: '4px solid var(--primary)' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={18} color="var(--primary)" /> Security & Authentication
        </h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            Your account is secured with standard encryption. Password resets will be sent to your primary email address.
        </p>
        <button
            className="btn btn-outline"
            onClick={onResetPassword}
        >
            <RefreshCw size={14} /> Reset Password
        </button>
    </div>
);

export default SecuritySection;
