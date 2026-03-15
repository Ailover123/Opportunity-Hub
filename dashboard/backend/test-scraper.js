const scraperService = require('./src/services/scraperService');

(async () => {
    try {
        console.log('Testing Unstop Scraper...');
        const results = await scraperService.scrapeUnstop();
        console.log('Scrape Results:', JSON.stringify(results.slice(0, 3), null, 2));
        console.log('Total Results:', results.length);
        await scraperService.close();
        process.exit(0);
    } catch (err) {
        console.error('Scrape Error:', err);
        process.exit(1);
    }
})();
