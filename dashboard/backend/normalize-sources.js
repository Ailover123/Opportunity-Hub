const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, 'opportunityhub.db');
const db = new sqlite3.Database(dbPath);

console.log('Normalizing database sources...');

db.serialize(() => {
    // 1. Convert all sources to lowercase
    db.run("UPDATE opportunities SET source = LOWER(source)", (err) => {
        if (err) console.error('Error lowering sources:', err);
    });

    // 2. Map internal/direct/system labels to a single string 'internal'
    db.run("UPDATE opportunities SET source = 'internal' WHERE source IN ('direct', 'system', 'verified hub', 'internal')", (err) => {
        if (err) console.error('Error mapping internal sources:', err);
    });

    // 3. Verify
    db.all("SELECT DISTINCT source, COUNT(*) as count FROM opportunities GROUP BY source", [], (err, rows) => {
        if (err) console.error(err);
        console.log('Normalized Sources:', rows);
        db.close();
    });
});
