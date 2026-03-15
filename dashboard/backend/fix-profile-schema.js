const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, 'opportunityhub.db');
const db = new sqlite3.Database(dbPath);

console.log('Inspecting users table schema...');
db.all("PRAGMA table_info(users);", [], (err, rows) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    console.log('Columns in users table:');
    rows.forEach(row => {
        console.log(`- ${row.name} (${row.type})`);
    });

    const requiredColumns = ['bio', 'skills', 'github_url', 'avatar_url'];
    const existingColumns = rows.map(r => r.name);
    const missingColumns = requiredColumns.filter(c => !existingColumns.includes(c));

    if (missingColumns.length === 0) {
        console.log('✔ All required columns exist.');
        db.close();
    } else {
        console.log(`⚠ Missing columns: ${missingColumns.join(', ')}`);
        console.log('Applying migration...');

        let completed = 0;
        missingColumns.forEach(col => {
            db.run(`ALTER TABLE users ADD COLUMN ${col} TEXT`, (err) => {
                if (err) console.error(`Failed to add ${col}:`, err.message);
                else console.log(`+ Added column: ${col}`);

                completed++;
                if (completed === missingColumns.length) {
                    console.log('✔ Migration finished.');
                    db.close();
                }
            });
        });
    }
});
