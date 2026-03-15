const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./opportunityhub.db');
const { v4: uuidv4 } = require('uuid');

class NotificationService {
    constructor() {
        // Ensure notifications table exists
        db.run(`CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      type TEXT,
      message TEXT,
      read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    }

    async send(userId, type, message) {
        const id = uuidv4();
        console.log(`[Notification] ${type} for ${userId}: ${message}`);

        return new Promise((resolve, reject) => {
            db.run('INSERT INTO notifications (id, user_id, type, message) VALUES (?, ?, ?, ?)',
                [id, userId, type, message],
                (err) => {
                    if (err) reject(err);
                    else resolve(id);
                }
            );
        });
    }

    async getForUser(userId) {
        return new Promise((resolve, reject) => {
            db.all('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 20',
                [userId],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });
    }
}

module.exports = new NotificationService();
