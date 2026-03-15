const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
    const page = await browser.newPage();

    const getTitles = async (p) => {
        console.log(`Fetching Page ${p}...`);
        await page.goto('https://unstop.com/hackathons?page=' + p, { waitUntil: 'networkidle2' });
        return await page.evaluate(() => {
            return Array.from(document.querySelectorAll('h3[itemprop="name"]')).map(el => el.innerText.trim());
        });
    };

    const p1 = await getTitles(1);
    const p2 = await getTitles(2);
    const p3 = await getTitles(3);

    console.log('Page 1 Count:', p1.length);
    console.log('Page 2 Count:', p2.length);
    console.log('Page 3 Count:', p3.length);

    const overlap12 = p1.filter(t => p2.includes(t));
    const overlap23 = p2.filter(t => p3.includes(t));

    console.log('Overlap P1 vs P2:', overlap12.length);
    console.log('Overlap P2 vs P3:', overlap23.length);

    if (overlap12.length > 10) {
        console.log('MAJOR OVERLAP DETECTED! ?page=X is likely being ignored by Unstop.');
    }

    await browser.close();
})();
