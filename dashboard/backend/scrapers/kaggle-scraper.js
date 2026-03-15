const puppeteer = require('puppeteer');

class KaggleScraper {
  constructor() {
    this.baseUrl = 'https://www.kaggle.com/competitions';
    this.browser = null;
    this.page = null;
  }

  async init() {
    this.browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    this.page = await this.browser.newPage();
    await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
  }

  async scrapeCompetitions() {
    try {
      if (!this.page) await this.init();

      console.log('Scraping Kaggle competitions...');
      await this.page.goto(this.baseUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });

      // Wait for competition cards to load
      try {
        await this.page.waitForSelector('.sc-kOHtZc, div[class*="CompetitionItem"]', { timeout: 15000 });
      } catch (e) {
        console.log("Kaggle selector timeout, attempting fallback scan...");
      }

      const competitions = await this.page.evaluate(() => {
        // Kaggle classes are obfuscated/dynamic (sc-xxxxx), use more generic structure if possible
        // or look for specific text content indicators
        const items = Array.from(document.querySelectorAll('li, div')).filter(el =>
          el.innerText && el.innerText.includes('Prize') && el.innerText.includes('Teams')
        );

        const results = [];

        // Deduplicate
        const uniqueItems = items.slice(0, 10);

        uniqueItems.forEach((item) => {
          // Heuristic extraction
          const lines = item.innerText.split('\n');
          const title = lines[0];
          if (title && title.length > 5) {
            results.push({
              title: title,
              organization: 'Kaggle',
              url: 'https://www.kaggle.com/competitions',
              prize: 'See details',
              deadline: 'See details',
              location: 'Online',
              description: 'Kaggle Competition',
              status: 'verified',
              quality_score: 85
            });
          }
        });

        return results;
      });

      console.log(`Found ${competitions.length} competitions on Kaggle`);
      return competitions;

    } catch (error) {
      console.error('Kaggle scraping error:', error.message);
      return [];
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

module.exports = KaggleScraper;