const { db } = require('../utils/db');
const scraperService = require('../services/scraperService');
const notificationService = require('../services/notificationService');
const { v4: uuidv4 } = require('uuid');

class BaseWorker {
    constructor(io) {
        this.io = io;
        this.isProcessing = false;
        this.queue = [];
    }

    async addTask(userId, plan) {
        console.log(`[Worker] Task added for user ${userId} (${plan})`);
        this.queue.push({ userId, plan, id: uuidv4() });
        this.emitStatus(userId, 'queued', 'Your request is in the pipeline...');
        if (!this.isProcessing) this.processNext();
    }

    async processNext() {
        if (this.queue.length === 0) {
            this.isProcessing = false;
            return;
        }

        this.isProcessing = true;
        const task = this.queue.shift();

        try {
            this.emitStatus(task.userId, 'processing', 'Initializing intelligent scraper nodes...');

            // Tier-based target selection
            let targets = ['devpost', 'kaggle']; // Base Free Tier
            
            if (task.plan === 'pro') {
                targets = ['devpost', 'kaggle', 'unstop', 'indeed'];
            } else if (task.plan === 'team') {
                targets = ['devpost', 'kaggle', 'unstop', 'indeed', 'coursera'];
            }

            let totalNew = 0;
            let totalFound = 0;
            
            for (const target of targets) {
                this.emitStatus(task.userId, 'scraping', `Syncing with ${target.toUpperCase()}...`);

                try {
                    const results = await scraperService.scrape(target);
                    totalFound += results.length;

                    for (const item of results) {
                        const exists = await this.checkExists(task.userId, item);
                        if (!exists) {
                            await this.saveOpportunity(task.userId, item);
                            totalNew++;
                        }
                    }
                } catch (scrapeError) {
                    console.error(`[Worker] Failed to scrape ${target}:`, scrapeError.message);
                }
            }

            console.log(`[Worker] Sync Summary: Found ${totalFound}, New ${totalNew}`);
            this.emitStatus(task.userId, 'completed', `Sync Complete: Found ${totalFound} items (${totalNew} new)`);

            const platformNames = targets.map(t => {
                const s = t.toLowerCase();
                if (s === 'unstop') return 'GLOBAL REACH';
                return t.toUpperCase();
            }).join(', ');

            await notificationService.send(task.userId, 'success', `Successfully processed ${platformNames} ${targets.length === 1 ? 'platform' : 'platforms'}.`);

        } catch (error) {
            console.error(`[Worker] Task ${task.id} failed:`, error.message);
            this.emitStatus(task.userId, 'failed', `Worker encountered an issue: ${error.message}`);
        }

        this.processNext();
    }

    emitStatus(userId, status, message) {
        if (this.io) {
            this.io.to(userId).emit('worker_status', { status, message, timestamp: new Date() });
        }
    }

    async checkExists(userId, item) {
        // For external sources (Unstop, etc), URL is the best unique ID
        // For internal ones, title + user_id is the fallback
        const query = item.url
            ? 'SELECT id FROM opportunities WHERE user_id = ? AND url = ?'
            : 'SELECT id FROM opportunities WHERE user_id = ? AND title = ?';
        const param = item.url || item.title;

        try {
            const row = await db.get(query, [userId, param]);
            return !!row;
        } catch (err) {
            console.error('[Worker] checkExists failed:', err.message);
            return false;
        }
    }


    async saveOpportunity(userId, item) {
        const id = uuidv4();
        try {
            await db.run(
                'INSERT INTO opportunities (id, user_id, title, organization, deadline, source, url, category, collected_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)',
                [id, userId, item.title, item.organization, item.deadline, item.source.toLowerCase(), item.url, item.category || 'general']
            );
        } catch (err) {
            console.error('[Worker] saveOpportunity failed:', err.message);
            throw err;
        }
    }

}

module.exports = BaseWorker;
