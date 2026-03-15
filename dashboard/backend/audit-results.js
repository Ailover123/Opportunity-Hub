const { db, initDB } = require('./src/utils/db');

(async () => {
    await initDB();
    db.all('SELECT count(*) as count, source FROM opportunities GROUP BY source', (err, rows) => {
        if (err) console.error(err);
        console.log('Database Statistics:', rows);

        db.all('SELECT title, url FROM opportunities WHERE source = "unstop" LIMIT 5', (err, rows) => {
            console.log('Sample Unstop Data:', rows);
            process.exit(0);
        });
    });
})();
