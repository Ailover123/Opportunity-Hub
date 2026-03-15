const { db } = require('./src/utils/db');

db.get('SELECT COUNT(*) as count FROM opportunities', [], (err, row) => {
    if (err) console.error(err);
    else console.log('Opportunities Count:', row.count);

    db.all('SELECT * FROM opportunities LIMIT 5', [], (err, rows) => {
        if (err) console.error(err);
        else console.log('Sample Data:', JSON.stringify(rows, null, 2));
        process.exit(0);
    });
});
