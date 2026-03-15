import React from 'react';
import { Search, PlusCircle } from 'lucide-react';

const TeamSidebar = ({ teams, activeTeam, setActiveTeam }) => (
    <div style={{ width: 280, background: 'white', borderRight: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-light)' }}>
            <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--text-secondary)' }} />
                <input
                    type="text"
                    placeholder="Search channels..."
                    style={{ width: '100%', padding: '0.5rem 0.5rem 0.5rem 2rem', borderRadius: 6, border: '1px solid var(--border-light)', fontSize: '0.875rem' }}
                />
            </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Workspaces</span>
                <PlusCircle size={16} color="var(--primary)" style={{ cursor: 'pointer' }} />
            </div>
            {teams.map(team => (
                <div
                    key={team.id}
                    onClick={() => setActiveTeam(team)}
                    style={{
                        padding: '0.625rem 0.75rem',
                        borderRadius: '6px',
                        marginBottom: '2px',
                        cursor: 'pointer',
                        background: activeTeam?.id === team.id ? 'var(--primary-glow)' : 'transparent',
                        color: activeTeam?.id === team.id ? 'var(--primary)' : 'var(--text-primary)',
                        fontWeight: activeTeam?.id === team.id ? 600 : 500,
                        fontSize: '0.875rem'
                    }}
                >
                    # {team.name}
                </div>
            ))}
        </div>
    </div>
);

export default TeamSidebar;
