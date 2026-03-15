const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const db = new sqlite3.Database('./opportunityhub.db');

const email = 'demo@opphub.com';
const password = 'password123';

console.log('--- Auth Debug Report ---');

db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err) {
        console.error('[FAIL] Database error:', err.message);
        return;
    }

    if (!user) {
        console.error('[FAIL] User "demo@opphub.com" NOT FOUND in database.');
        console.log('Available users:');
        db.all('SELECT email FROM users', [], (err, rows) => {
            console.log(rows);
            db.close();
        });
        return;
    }

    console.log('[PASS] User found in DB:', user.email);
    console.log('Plan:', user.plan_id);

    try {
        const isValid = await bcrypt.compare(password, user.password);
        if (isValid) {
            console.log('[PASS] Password matches decrypted hash.');
        } else {
            console.error('[FAIL] Password mismatch!');
            console.log('Stored hash:', user.password);
        }
    } catch (e) {
        console.error('[ERROR] Bcrypt comparison failed:', e.message);
    }

    db.close();
});
