import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer = ({ children }) => (
    <div style={{
        position: 'fixed',
        top: '24px',
        right: '24px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        pointerEvents: 'none'
    }}>
        <AnimatePresence>
            {children}
        </AnimatePresence>
    </div>
);

export const Toast = ({ message, type, onClose }) => {
    const config = {
        success: { icon: <CheckCircle2 size={18} />, color: '#10b981', bg: '#ecfdf5', border: '#10b981' },
        error: { icon: <AlertCircle size={18} />, color: '#ef4444', bg: '#fef2f2', border: '#ef4444' },
        info: { icon: <Info size={18} />, color: '#3b82f6', bg: '#eff6ff', border: '#3b82f6' }
    };

    const { icon, color, bg, border } = config[type] || config.info;

    return (
        <motion.div
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            style={{
                pointerEvents: 'auto',
                background: bg,
                border: `1px solid ${border}`,
                padding: '12px 16px',
                borderRadius: '8px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                minWidth: '300px',
                maxWidth: '450px'
            }}
        >
            <div style={{ color }}>{icon}</div>
            <div style={{ flex: 1, fontSize: '0.875rem', fontWeight: 500, color: '#1e293b' }}>
                {message}
            </div>
            <button
                onClick={onClose}
                style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#64748b',
                    cursor: 'pointer',
                    display: 'flex',
                    padding: '4px',
                    borderRadius: '4px'
                }}
            >
                <X size={14} />
            </button>
        </motion.div>
    );
};
