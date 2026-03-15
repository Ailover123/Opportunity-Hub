const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    const browser = await puppeteer.launch({ headless: "new", args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    try {
        console.log('Navigating to Unstop...');
        await page.goto('https://unstop.com/hackathons', { waitUntil: 'networkidle2' });
        await page.waitForSelector('h3', { timeout: 10000 });

        const diagnostic = await page.evaluate(() => {
            const results = [];
            // Find all h3 tags (usually titles)
            const titles = Array.from(document.querySelectorAll('h3'));
            results.push(`Found ${titles.length} h3 tags.`);

            // For the first few titles, find their parent 'a' or 'div' classes
            titles.slice(0, 5).forEach((t, i) => {
                let parent = t.parentElement;
                let path = [];
                while (parent && parent !== document.body && path.length < 5) {
                    path.push(`${parent.tagName}.${parent.className.split(' ').join('.')}`);
                    parent = parent.parentElement;
                }
                results.push(`Title ${i}: "${t.innerText.trim()}" | Path: ${path.join(' > ')}`);
            });

            // Check for any 'Load More' text
            const buttons = Array.from(document.querySelectorAll('button, a'));
            const loadMore = buttons.filter(b => b.innerText.toLowerCase().includes('load') || b.innerText.toLowerCase().includes('more'));
            results.push(`Found ${loadMore.length} potential 'Load More' elements.`);
            loadMore.forEach(b => results.push(`Button: "${b.innerText.trim()}" | Class: ${b.className}`));

            return results;
        });

        console.log('Diagnostic Results:', diagnostic.join('\n'));
        await browser.close();
    } catch (err) {
        console.error('Diagnostic Error:', err);
        await browser.close();
    }
})();
