const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./opportunityhub.db');

db.serialize(() => {
  console.log('--- Critical SaaS Schema Re-init ---');

  // Users
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE,
    name TEXT,
    password TEXT,
    plan_id TEXT DEFAULT 'free',
    google_drive_token TEXT,
    google_drive_refresh_token TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Teams
  db.run(`CREATE TABLE IF NOT EXISTS teams (
    id TEXT PRIMARY KEY,
    name TEXT,
    owner_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Team Members
  db.run(`CREATE TABLE IF NOT EXISTS team_members (
    team_id TEXT,
    user_id TEXT,
    role TEXT,
    PRIMARY KEY(team_id, user_id)
  )`);

  // Discussions (Chat)
  db.run(`CREATE TABLE IF NOT EXISTS discussions (
    id TEXT PRIMARY KEY,
    team_id TEXT,
    user_id TEXT,
    content TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Opportunities (Scraped Data)
  db.run(`CREATE TABLE IF NOT EXISTS opportunities (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    title TEXT,
    organization TEXT,
    deadline TEXT,
    source TEXT,
    status TEXT DEFAULT 'verified',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Meetings
  db.run(`CREATE TABLE IF NOT EXISTS meetings (
    id TEXT PRIMARY KEY,
    team_id TEXT,
    title TEXT,
    time TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Notifications
  db.run(`CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    type TEXT,
    message TEXT,
    read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  console.log('[COMPLETE] All clean tables instantiated. System ready for onboarding.');
});
