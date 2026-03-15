const { db } = require('./src/utils/db');

db.serialize(() => {
    db.run('ALTER TABLE opportunities ADD COLUMN collected_at DATETIME', (err) => {
        if (err) {
            console.error('Error adding collected_at:', err.message);
        } else {
            console.log('Column collected_at added successfully.');
            // Backfill with current time for existing rows
            db.run("UPDATE opportunities SET collected_at = CURRENT_TIMESTAMP WHERE collected_at IS NULL");
        }
        process.exit(0);
    });
});
