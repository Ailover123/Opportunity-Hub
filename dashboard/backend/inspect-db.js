const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, 'opportunityhub.db');
const db = new sqlite3.Database(dbPath);

db.all('SELECT id, title, source, url, collected_at FROM opportunities LIMIT 10', [], (err, rows) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    console.log(JSON.stringify(rows, null, 2));
    db.close();
});
