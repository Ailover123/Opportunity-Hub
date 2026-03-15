const { db, initDB } = require('./src/utils/db');

(async () => {
    await initDB();
    console.log('Forcing a Deep Clean of Unstop records for a fresh sync...');

    // Deleting all unstop records to ensure the next sync (which we know finds 54)
    // will treat all 54 as NEW and save them with correct URLs into the DB.
    db.run('DELETE FROM opportunities WHERE source = "unstop"', (err) => {
        if (err) {
            console.error('Deep Clean failed:', err);
        } else {
            console.log('Deep Clean successful. Database is ready for a fresh 54-item sync.');
        }
        process.exit(0);
    });
})();
