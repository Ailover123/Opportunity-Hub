const { db } = require('./src/utils/db');

const columnsToAdd = [
    { name: 'url', type: 'TEXT' },
    { name: 'category', type: 'TEXT' },
    { name: 'description', type: 'TEXT' },
    { name: 'prize', type: 'TEXT' },
    { name: 'location', type: 'TEXT' },
    { name: 'quality_score', type: 'INTEGER DEFAULT 0' },
    { name: 'collected_at', type: 'DATETIME DEFAULT CURRENT_TIMESTAMP' }
];

db.serialize(() => {
    columnsToAdd.forEach(col => {
        db.run(`ALTER TABLE opportunities ADD COLUMN ${col.name} ${col.type}`, (err) => {
            if (err) {
                if (err.message.includes('duplicate column name')) {
                    console.log(`Column ${col.name} already exists.`);
                } else {
                    console.error(`Error adding ${col.name}:`, err.message);
                }
            } else {
                console.log(`Column ${col.name} added successfully.`);
            }
        });
    });

    // Also check status default value
    // Current is 'verified', db.js says 'pending'
    console.log('Migration step complete.');
});
