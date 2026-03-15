const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
    const browser = await puppeteer.launch({ headless: "new", args: ['--no-sandbox'] });
    const page = await browser.newPage();
    try {
        await page.goto('https://unstop.com/hackathons', { waitUntil: 'networkidle2' });
        await page.waitForSelector('h3', { timeout: 10000 });

        // Scroll the container to the bottom
        await page.evaluate(async () => {
            const container = document.querySelector('#app-main-container');
            if (container) {
                container.scrollTop = container.scrollHeight;
                await new Promise(r => setTimeout(r, 2000));
            }
        });

        await page.screenshot({ path: path.join(process.cwd(), 'container_bottom.png'), fullPage: false });

        const count = await page.evaluate(() => document.querySelectorAll('h3[itemprop="name"]').length);
        console.log('Current Count after one scroll:', count);

        await browser.close();
    } catch (err) {
        console.error('Error:', err);
        await browser.close();
    }
})();
