const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
    const page = await browser.newPage();

    console.log('Navigating to Unstop...');
    await page.goto('https://unstop.com/hackathons', { waitUntil: 'networkidle2' });

    const t1 = await page.evaluate(() => document.querySelector('h3[itemprop="name"]').innerText.trim());
    console.log('P1 First Title:', t1);

    console.log('Clicking Page 2...');
    // Look for the "2" button in the pagination
    const clicked = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('.ngx-pagination a, .pagination a'));
        const page2 = links.find(l => l.innerText.trim() === '2');
        if (page2) {
            page2.click();
            return true;
        }
        return false;
    });

    console.log('Click result:', clicked);
    if (clicked) {
        await new Promise(r => setTimeout(r, 5000));
        const t2 = await page.evaluate(() => document.querySelector('h3[itemprop="name"]').innerText.trim());
        console.log('New URL:', page.url());
        console.log('P2 First Title:', t2);

        if (t1 === t2) {
            console.log('Titles are IDENTICAL. Pagination click did not load new content.');
        } else {
            console.log('Titles are DIFFERENT. Pagination click works!');
        }
    }

    await browser.close();
})();
