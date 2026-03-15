const scraperService = require('./scraperService');
const notificationService = require('./notificationService');
const sheetService = require('./sheetService');
const GoogleDriveIntegration = require('../../google-drive-integration');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./opportunityhub.db');
const { v4: uuidv4 } = require('uuid');

class WorkerService {
    constructor() {
        this.queue = [];
        this.isProcessing = false;
    }

    async addTask(userId, plan) {
        this.queue.push({ userId, plan, timestamp: new Date() });
        if (!this.isProcessing) this.processQueue();
    }

    async processQueue() {
        if (this.queue.length === 0) {
            this.isProcessing = false;
            return;
        }

        this.isProcessing = true;
        const task = this.queue.shift();

        try {
            await notificationService.send(task.userId, 'info', 'Background sync node initialized...');

            const results = await scraperService.scrapeUnstop();
            let newItemsCount = 0;
            const allOpps = [];

            for (const item of results) {
                const id = uuidv4();
                const exists = await new Promise((resolve) => {
                    db.get('SELECT id FROM opportunities WHERE user_id = ? AND title = ?', [task.userId, item.title], (err, row) => {
                        resolve(!!row);
                    });
                });

                if (!exists) {
                    await new Promise((resolve, reject) => {
                        db.run('INSERT INTO opportunities (id, user_id, title, organization, deadline, source) VALUES (?, ?, ?, ?, ?, ?)',
                            [id, task.userId, item.title, item.organization, item.deadline, item.source],
                            (err) => {
                                if (err) reject(err);
                                else {
                                    newItemsCount++;
                                    allOpps.push({ ...item, created_at: new Date().toISOString() });
                                    resolve();
                                }
                            }
                        );
                    });
                }
            }

            await notificationService.send(task.userId, 'success', `Scraping complete. Found ${newItemsCount} new high-value opportunities.`);

            // Automated GDrive Sync for Pro/Team Tiers
            if (task.plan !== 'free' && newItemsCount > 0) {
                try {
                    // Fetch user tokens
                    const user = await new Promise((resolve) => {
                        db.get('SELECT google_drive_token, google_drive_refresh_token FROM users WHERE id = ?', [task.userId], (err, row) => {
                            resolve(row);
                        });
                    });

                    if (user && user.google_drive_token) {
                        await notificationService.send(task.userId, 'info', 'Auto-generating cloud manifest...');

                        const { filePath, fileName } = await sheetService.generateOpportunityCsv(task.userId, allOpps);

                        const driveManager = new GoogleDriveIntegration();
                        driveManager.setTokens({
                            access_token: user.google_drive_token,
                            refresh_token: user.google_drive_refresh_token
                        });

                        await driveManager.uploadCsvFile(filePath, `OppHub_Sync_${new Date().toLocaleDateString()}.csv`);
                        await notificationService.send(task.userId, 'success', 'Cloud Pipeline Sync Complete: Results available in Google Drive.');
                    } else {
                        console.log(`[Worker] No GDrive tokens found for user ${task.userId}`);
                    }
                } catch (driveErr) {
                    console.error('[Worker] Drive sync failed:', driveErr.message);
                    await notificationService.send(task.userId, 'error', 'Cloud sync failed. Check Drive connectivity settings.');
                }
            }

        } catch (error) {
            console.error(`[Worker] Pipeline error for ${task.userId}:`, error.message);
            await notificationService.send(task.userId, 'error', `System Node failed: ${error.message}`);
        }

        this.processQueue();
    }
}

module.exports = new WorkerService();
