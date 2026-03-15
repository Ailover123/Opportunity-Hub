const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const dbPath = path.resolve(__dirname, '../../opportunityhub.db');
const db = new sqlite3.Database(dbPath);

const initDB = () => {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            // Users table (SaaS ready)
            db.run(`CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                email TEXT UNIQUE,
                name TEXT,
                password TEXT,
                plan_id TEXT DEFAULT 'free',
                google_drive_token TEXT,
                google_drive_refresh_token TEXT,
                bio TEXT,
                skills TEXT,
                github_url TEXT,
                avatar_url TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`);

            // Opportunities (Collected data)
            db.run(`CREATE TABLE IF NOT EXISTS opportunities (
                id TEXT PRIMARY KEY,
                user_id TEXT,
                title TEXT,
                organization TEXT,
                deadline TEXT,
                source TEXT,
                url TEXT,
                category TEXT,
                description TEXT,
                prize TEXT,
                location TEXT,
                status TEXT DEFAULT 'pending',
                quality_score INTEGER DEFAULT 0,
                collected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(user_id) REFERENCES users(id)
            )`);

            // Teams & Community
            db.run(`CREATE TABLE IF NOT EXISTS teams (
                id TEXT PRIMARY KEY,
                name TEXT,
                owner_id TEXT,
                description TEXT,
                is_private BOOLEAN DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(owner_id) REFERENCES users(id)
            )`);

            db.run(`CREATE TABLE IF NOT EXISTS team_members (
                team_id TEXT,
                user_id TEXT,
                role TEXT DEFAULT 'member',
                joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY(team_id, user_id),
                FOREIGN KEY(team_id) REFERENCES teams(id),
                FOREIGN KEY(user_id) REFERENCES users(id)
            )`);

            db.run(`CREATE TABLE IF NOT EXISTS messages (
                id TEXT PRIMARY KEY,
                team_id TEXT,
                user_id TEXT,
                content TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(team_id) REFERENCES teams(id),
                FOREIGN KEY(user_id) REFERENCES users(id)
            )`);

            // Meetings
            db.run(`CREATE TABLE IF NOT EXISTS meetings (
                id TEXT PRIMARY KEY,
                team_id TEXT,
                title TEXT,
                startTime DATETIME,
                link TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(team_id) REFERENCES teams(id)
            )`);

            // Schedules
            db.run(`CREATE TABLE IF NOT EXISTS schedules (
                id TEXT PRIMARY KEY,
                user_id TEXT,
                frequency TEXT,
                time TEXT,
                enabled BOOLEAN DEFAULT 1,
                last_run DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(user_id) REFERENCES users(id)
            )`);

            console.log('✔ Database Schema Initialized / Verified');

            // Perform Lazy Auth Migration
            db.all("SELECT id, google_drive_token FROM users WHERE password IS NULL OR password = ''", [], (err, rows) => {
                if (err) return resolve(); // Table might not exist or be empty

                rows.forEach(user => {
                    if (user.google_drive_token && user.google_drive_token.startsWith('$2')) {
                        console.log(`[Migration] Moving password from token column for user: ${user.id}`);
                        db.run("UPDATE users SET password = ? WHERE id = ?", [user.google_drive_token, user.id]);
                    }
                });
                resolve();
            });
        });
    });
};

module.exports = { db, initDB };
