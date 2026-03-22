const puppeteer = require('puppeteer');
const cheerio = require('cheerio');

class DevpostScraper {
  constructor() {
    this.baseUrl = 'https://devpost.com/hackathons';
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

  async scrapeHackathons() {
    try {
      if (!this.page) await this.init();
      
      console.log(`[Devpost] Navigating to: ${this.baseUrl} [V3-ACTIVE]`);
      await this.page.goto(this.baseUrl, { waitUntil: 'load', timeout: 30000 });
      
      // Traditional wait
      await new Promise(r => setTimeout(r, 4000));
      
      const title = await this.page.title();
      const content = await this.page.content();
      const $ = cheerio.load(content);
      
      console.log(`[Devpost] Page Title: ${title}`);
      
      const results = [];
      const seenTitles = new Set();
      
      // Look for hackathon tiles or any h3/a with hackathon keywords
      $('.hackathon-tile, article, div[class*="HackathonTile"], h3').each((i, el) => {
        const $el = $(el);
        const titleEl = $el.find('h3, h4, a[href*="devpost.com/hackathons/"]').first();
        const text = titleEl.text().trim() || $el.text().trim().split('\n')[0];
        const href = titleEl.attr('href') || $el.find('a').attr('href');
        
        if (text && text.length > 5 && !seenTitles.has(text) && !text.includes('Sign In')) {
          seenTitles.add(text);
          // Location extraction
          let location = 'Online';
          const locEl = $el.find('.location, .hackathon-location, span[class*="location"]').first();
          if (locEl.length) {
            location = locEl.text().trim();
          } else if ($el.text().toLowerCase().includes('online')) {
            location = 'Online';
          }

          results.push({
            title: text,
            organization: $el.find('.organizer, .hackathon-tile-organizer').text().trim() || 'Devpost',
            url: href ? (href.startsWith('http') ? href : `https://${href}`) : this.baseUrl,
            source: 'devpost',
            prize: $el.find('.prize-amount, .prize').text().trim() || 'See details',
            deadline: 'Ongoing',
            location: location,
            description: `Hackathon: ${text}`
          });
        }
      });

      console.log(`Found ${results.length} hackathons on Devpost (Parsed via Cheerio)`);
      return results;

    } catch (error) {
      console.error('Devpost scraping error:', error.message);
      return [];
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

module.exports = DevpostScraper;