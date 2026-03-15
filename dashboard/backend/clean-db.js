const { db, initDB } = require('./src/utils/db');

(async () => {
    await initDB();
    console.log('Cleaning up null URLs in Unstop data...');

    // For Unstop, if URL is null, we can't easily recover it without re-scraping,
    // so it's safer to DELETE those duplicates and let the next sync find them correctly with URLs.
    db.run('DELETE FROM opportunities WHERE source = "unstop" AND url IS NULL', (err) => {
        if (err) {
            console.error('Cleanup failed:', err);
        } else {
            console.log('Cleanup successful. Null URL records removed.');
        }
        process.exit(0);
    });
})();
