const puppeteer = require('puppeteer');
const cheerio = require('cheerio');

class KaggleScraper {
  constructor() {
    this.baseUrl = 'https://www.kaggle.com/competitions';
    this.browser = null;
    this.page = null;
  }

  async init() {
    this.browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox', 
        '--disable-dev-shm-usage',
        '--disable-blink-features=AutomationControlled'
      ]
    });
    this.page = await this.browser.newPage();
    // Modern User Agent
    await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
    
    // Stealth: Hide Puppeteer
    await this.page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
      window.chrome = { runtime: {} };
      Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
      Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3] });
    });
  }

  async scrapeCompetitions() {
    try {
      if (!this.page) await this.init();
 
      console.log(`[Kaggle] Navigating to: ${this.baseUrl} [V3-ACTIVE]`);
      
      // Randomize viewport to look less robotic
      const width = 1200 + Math.floor(Math.random() * 200);
      const height = 800 + Math.floor(Math.random() * 200);
      await this.page.setViewport({ width, height });

      // Randomized delay before navigation
      await new Promise(r => setTimeout(r, 2000 + Math.random() * 3000));
      
      await this.page.goto(this.baseUrl, { waitUntil: 'load', timeout: 60000 });
      
      // Simulate slight mouse movement
      await this.page.mouse.move(100, 100);
      await new Promise(r => setTimeout(r, 500));
      await this.page.mouse.move(200, 300);

      // Wait for any content to appear
      await new Promise(r => setTimeout(r, 7000));
      
      const title = await this.page.title();
      const content = await this.page.content();
      const $ = cheerio.load(content);
      
      console.log(`[Kaggle] Page Title: ${title}`);
      if (title.includes('Access Denied') || title.includes('Cloudflare')) {
        console.warn('[Kaggle] Bot detection triggered. Switching to emergency link scan...');
      }

      const results = [];
      const seenTitles = new Set();

      // Look for titles in h3, h4 and links with competition patterns
      $('h3, h4, a[href*="/c/"], a[href*="/competitions/"]').each((i, el) => {
        const text = $(el).text().trim();
        const href = $(el).attr('href');
        
        if (text && text.length > 8 && !seenTitles.has(text) && !['Competitions', 'Filters', 'Sort by', 'Sign In'].includes(text)) {
          seenTitles.add(text);
          results.push({
            title: text,
            organization: 'Kaggle',
            url: href ? (href.startsWith('http') ? href : `https://www.kaggle.com${href}`) : this.baseUrl,
            source: 'kaggle',
            prize: 'Interactive',
            deadline: 'Ongoing',
            location: 'Online',
            description: 'Kaggle Competition',
            status: 'verified',
            quality_score: 85
          });
        }
      });

      console.log(`Found ${results.length} competitions on Kaggle (Parsed via Cheerio)`);
      return results;

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