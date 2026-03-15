const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'opportunityhub.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    console.log('Truncating users table...');
    db.run('DELETE FROM users', (err) => {
        if (err) {
            console.error('Error truncating users:', err.message);
        } else {
            console.log('Successfully truncated users table.');
        }
    });
});

db.close();
