const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: "new", args: ['--no-sandbox'] });
    const page = await browser.newPage();
    try {
        await page.goto('https://unstop.com/hackathons', { waitUntil: 'networkidle2' });
        await page.waitForSelector('h3', { timeout: 10000 });

        const scrollInfo = await page.evaluate(() => {
            const results = [];
            const allElements = document.querySelectorAll('*');
            for (const el of allElements) {
                const style = window.getComputedStyle(el);
                if ((style.overflowY === 'auto' || style.overflowY === 'scroll') && el.scrollHeight > el.clientHeight) {
                    results.push({
                        tag: el.tagName,
                        className: el.className,
                        id: el.id,
                        scrollHeight: el.scrollHeight,
                        clientHeight: el.clientHeight
                    });
                }
            }
            return results;
        });

        console.log('Scrollable Elements Found:', JSON.stringify(scrollInfo, null, 2));
        await browser.close();
    } catch (err) {
        console.error('Error:', err);
        await browser.close();
    }
})();
