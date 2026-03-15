const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

async function setupDemoUser() {
    const db = new sqlite3.Database('./opportunityhub.db');
    const email = 'demo@opphub.com';
    const password = 'password123';
    const name = 'Demo User';
    const id = uuidv4();

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        db.get('SELECT id FROM users WHERE email = ?', [email], (err, row) => {
            if (err) {
                console.error('Error checking user:', err.message);
                db.close();
                return;
            }

            if (row) {
                db.run('UPDATE users SET password = ?, name = ?, plan_id = ? WHERE email = ?',
                    [hashedPassword, name, 'pro', email],
                    (err) => {
                        if (err) console.error('Error updating demo user:', err.message);
                        else console.log('Demo user updated successfully.');
                        db.close();
                    }
                );
            } else {
                db.run('INSERT INTO users (id, email, name, password, plan_id) VALUES (?, ?, ?, ?, ?)',
                    [id, email, name, hashedPassword, 'pro'],
                    (err) => {
                        if (err) console.error('Error creating demo user:', err.message);
                        else console.log('Demo user created successfully.');
                        db.close();
                    }
                );
            }
        });
    } catch (error) {
        console.error('Bcrypt failed:', error);
        db.close();
    }
}

setupDemoUser();
