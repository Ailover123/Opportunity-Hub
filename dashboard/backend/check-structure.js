const { db } = require('./src/utils/db');

db.all('PRAGMA table_info(opportunities)', [], (err, rows) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    console.log('Opportunities Table Info:');
    console.log(JSON.stringify(rows, null, 2));
    process.exit(0);
});
