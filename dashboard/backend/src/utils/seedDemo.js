const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./opportunityhub.db');
const { v4: uuidv4 } = require('uuid');

async function seedDemoData() {
    const email = 'demo@opphub.com';

    db.get('SELECT id FROM users WHERE email = ?', [email], (err, user) => {
        if (err || !user) {
            console.error('Demo user not found. Run forceFix.js first.');
            return;
        }

        const teamId = uuidv4();
        const meetingId = uuidv4();

        db.serialize(() => {
            // 1. Create a Team
            db.run('INSERT INTO teams (id, name, owner_id) VALUES (?, ?, ?)', [teamId, 'Alpha Hackers', user.id]);

            // 2. Add Demo User to Team
            db.run('INSERT OR IGNORE INTO team_members (team_id, user_id, role) VALUES (?, ?, ?)', [teamId, user.id, 'admin']);

            // 3. Add a Meeting
            db.run('INSERT INTO meetings (id, team_id, title, time) VALUES (?, ?, ?, ?)',
                [meetingId, teamId, 'Strategy: HackIndia 2026', 'Today, 8:00 PM']);

            // 4. Add some notifications
            db.run('INSERT INTO notifications (id, user_id, type, message) VALUES (?, ?, ?, ?)',
                [uuidv4(), user.id, 'success', 'SaaS Migration Complete: All nodes online.']);

            console.log('[SEED] Demo environment populated with team "Alpha Hackers" and upcoming meeting.');
        });
    });
}

seedDemoData();
