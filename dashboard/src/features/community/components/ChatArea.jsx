import React from 'react';
import { Paperclip, Send } from 'lucide-react';
import MessageItem from './MessageItem';

const ChatArea = ({ activeTeam, messages, newMessage, setNewMessage, sendMessage }) => (
    <div style={{ flex: 1, background: 'white', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '1rem 2rem', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700 }}># {activeTeam.name}</h2>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#e2e8f0' }} />
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#cbd5e1' }} />
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>+3</div>
            </div>
        </div>

        <div style={{ flex: 1, padding: '2rem', overflowY: 'auto', display: 'flex', flexDirection: 'column-reverse' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {messages.map((msg, i) => (
                    <MessageItem key={i} msg={msg} />
                ))}
            </div>
        </div>

        <div style={{ padding: '1.5rem 2rem', borderTop: '1px solid var(--border-light)' }}>
            <div style={{ display: 'flex', gap: '0.75rem', background: '#f8fafc', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                <button style={{ border: 'none', background: 'transparent', color: 'var(--text-secondary)' }}><Paperclip size={18} /></button>
                <input
                    type="text"
                    placeholder={`Message #${activeTeam.name}`}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: '0.875rem' }}
                />
                <button
                    onClick={sendMessage}
                    style={{ border: 'none', background: 'transparent', color: 'var(--primary)', cursor: 'pointer' }}
                >
                    <Send size={18} />
                </button>
            </div>
        </div>
    </div>
);

export default ChatArea;
