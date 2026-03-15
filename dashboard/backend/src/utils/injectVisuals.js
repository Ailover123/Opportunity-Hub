const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./opportunityhub.db');
const { v4: uuidv4 } = require('uuid');

async function injectRealData() {
    db.get('SELECT id FROM users ORDER BY created_at DESC LIMIT 1', async (err, user) => {
        if (err || !user) {
            console.error('No user found to inject data for.');
            return;
        }

        const userId = user.id;
        console.log(`Injecting data for User: ${userId}`);

        db.serialize(() => {
            // 1. Injected Opportunities
            const opps = [
                { title: 'Google Step Internship 2026', org: 'Google', deadline: '2026-03-15', source: 'Direct' },
                { title: 'Smart India Hackathon Finalist', org: 'AICTE', deadline: '2026-04-01', source: 'Unstop' },
                { title: 'Antigravity AI Challenge', org: 'Google DeepMind', deadline: '2026-02-28', source: 'Internal' }
            ];

            opps.forEach(o => {
                db.run('INSERT INTO opportunities (id, user_id, title, organization, deadline, source) VALUES (?, ?, ?, ?, ?, ?)',
                    [uuidv4(), userId, o.title, o.org, o.deadline, o.source]);
            });

            // 2. Create a Team & Meeting
            const teamId = uuidv4();
            db.run('INSERT INTO teams (id, name, owner_id) VALUES (?, ?, ?)', [teamId, 'Dream Team 2.0', userId]);
            db.run('INSERT INTO team_members (team_id, user_id, role) VALUES (?, ?, ?)', [teamId, userId, 'admin']);

            db.run('INSERT INTO meetings (id, team_id, title, time) VALUES (?, ?, ?, ?)',
                [uuidv4(), teamId, 'Hackathon Brainstorm', 'Tomorrow, 6:00 PM']);

            // 3. System Notification
            db.run('INSERT INTO notifications (id, user_id, type, message) VALUES (?, ?, ?, ?)',
                [uuidv4(), userId, 'success', 'All system nodes synchronized. Welcome, Nishal.']);

            console.log('[SUCCESS] Sample data injected. Ready for UI check.');
        });
    });
}

injectRealData();
