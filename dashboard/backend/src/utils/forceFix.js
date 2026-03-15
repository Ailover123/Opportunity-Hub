const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = new sqlite3.Database('./opportunityhub.db');

db.serialize(async () => {
    console.log('Force upgrading schema...');

    // Drop and recreate or alter
    // For safety in this dev environment, we'll create the correct table structure
    db.run(`DROP TABLE IF EXISTS users`);
    db.run(`CREATE TABLE users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE,
        name TEXT,
        picture TEXT,
        password TEXT,
        plan_id TEXT DEFAULT 'free',
        stripe_id TEXT,
        razorpay_id TEXT,
        google_drive_token TEXT,
        google_drive_refresh_token TEXT,
        google_session_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, async (err) => {
        if (err) {
            console.error('Migration failed:', err.message);
            return;
        }
        console.log('Users table created.');

        // Setup demo user
        const hashedPassword = await bcrypt.hash('password123', 10);
        db.run('INSERT INTO users (id, email, name, password, plan_id) VALUES (?, ?, ?, ?, ?)',
            [uuidv4(), 'demo@opphub.com', 'Demo User', hashedPassword, 'pro'],
            (err) => {
                if (err) console.error('Demo user creation failed:', err.message);
                else console.log('Demo user demo@opphub.com created with password123');
            }
        );
    });
});
