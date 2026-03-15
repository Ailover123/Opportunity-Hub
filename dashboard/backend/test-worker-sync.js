const MultiSyncWorker = require('./src/workers/baseWorker');
const { initDB, db } = require('./src/utils/db');

(async () => {
    await initDB();

    // Get a user ID from the database
    db.get('SELECT id FROM users LIMIT 1', async (err, user) => {
        if (err || !user) {
            console.error('No user found to test sync');
            process.exit(1);
        }

        console.log(`Starting Manual Sync for user: ${user.id}`);
        const worker = new MultiSyncWorker({
            to: () => ({
                emit: (name, data) => console.log(`[Socket] ${name}:`, data.status, '-', data.message)
            })
        });

        await worker.addTask(user.id, 'free');

        // Wait for worker to finish
        const checkFinished = setInterval(() => {
            if (!worker.isProcessing && worker.queue.length === 0) {
                clearInterval(checkFinished);
                console.log('Manual Sync Completed.');

                // Final check of DB count
                db.get('SELECT count(*) as count FROM opportunities WHERE source = "unstop"', (err, row) => {
                    console.log(`FINAL UNSTOP COUNT IN DB: ${row.count}`);
                    process.exit(0);
                });
            }
        }, 1000);
    });
})();
