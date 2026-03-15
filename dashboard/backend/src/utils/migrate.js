const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./opportunityhub.db');

db.serialize(() => {
  console.log('Starting migration...');

  // 1. Update Users table
  // Since SQLite doesn't support adding multiple columns in one ALTER, or RENAME column easily
  // We'll create a temp table, copy data, and swap.
  
  db.run(`CREATE TABLE IF NOT EXISTS users_new (
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
  )`);

  db.all("SELECT * FROM users", [], (err, rows) => {
    if (err) {
      console.log('Users table might not exist yet or error:', err.message);
      return;
    }

    rows.forEach(user => {
      // Lazy migration: if someone had a "password" in google_drive_token, move it
      const password = user.google_drive_token && user.google_drive_token.startsWith('$2') ? user.google_drive_token : null;
      db.run(`INSERT INTO users_new 
        (id, email, name, picture, password, google_drive_token, google_drive_refresh_token, google_session_id, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [user.id, user.email, user.name, user.picture, password, user.google_drive_token, user.google_drive_refresh_token, user.google_session_id, user.created_at]
      );
    });

    console.log('Data migrated to users_new');
    
    db.run("DROP TABLE users", () => {
      db.run("ALTER TABLE users_new RENAME TO users", () => {
        console.log('Users table upgraded.');
      });
    });
  });

  // 2. Add Teams Table
  db.run(`CREATE TABLE IF NOT EXISTS teams (
    id TEXT PRIMARY KEY,
    name TEXT,
    owner_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(owner_id) REFERENCES users(id)
  )`);

  // 3. Add Team Members Table
  db.run(`CREATE TABLE IF NOT EXISTS team_members (
    team_id TEXT,
    user_id TEXT,
    role TEXT DEFAULT 'member',
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(team_id, user_id),
    FOREIGN KEY(team_id) REFERENCES teams(id),
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);

  // 4. Add Discussions Table
  db.run(`CREATE TABLE IF NOT EXISTS discussions (
    id TEXT PRIMARY KEY,
    team_id TEXT,
    user_id TEXT,
    content TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(team_id) REFERENCES teams(id),
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);

  console.log('Migration scheduled.');
});

db.close();
