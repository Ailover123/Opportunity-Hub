const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, 'opportunityhub.db');
const db = new sqlite3.Database(dbPath);

console.log('--- Database Audit ---');

db.all("SELECT DISTINCT source FROM opportunities", [], (err, rows) => {
    if (err) console.error(err);
    console.log('Unique Sources in DB:', rows.map(r => r.source));
});

db.get("SELECT COUNT(*) as count FROM opportunities", [], (err, row) => {
    console.log('Total Opportunities:', row.count);
});

db.all("SELECT title, source, collected_at FROM opportunities ORDER BY collected_at DESC LIMIT 5", [], (err, rows) => {
    console.log('Recent Opportunities:', rows);
});

setTimeout(() => db.close(), 2000);
