const puppeteer = require('puppeteer');

class DevpostScraper {
  constructor() {
    this.baseUrl = 'https://devpost.com/hackathons';
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

  async scrapeHackathons() {
    try {
      if (!this.page) await this.init();
      
      console.log('Scraping Devpost hackathons...');
      await this.page.goto(this.baseUrl, { waitUntil: 'networkidle2', timeout: 30000 });
      
      // Wait for hackathon cards to load
      await this.page.waitForSelector('.hackathon-tile', { timeout: 10000 });
      
      const hackathons = await this.page.evaluate(() => {
        const tiles = document.querySelectorAll('.hackathon-tile');
        const results = [];
        
        tiles.forEach((tile, index) => {
          if (index >= 10) return; // Limit to 10 results
          
          const titleElement = tile.querySelector('.hackathon-tile-header h3 a');
          const organizerElement = tile.querySelector('.hackathon-tile-organizer');
          const prizeElement = tile.querySelector('.prize-amount');
          const deadlineElement = tile.querySelector('.submission-period');
          const locationElement = tile.querySelector('.hackathon-tile-location');
          
          if (titleElement) {
            results.push({
              title: titleElement.textContent.trim(),
              organization: organizerElement ? organizerElement.textContent.trim() : 'Devpost',
              url: titleElement.href,
              prize: prizeElement ? prizeElement.textContent.trim() : null,
              deadline: deadlineElement ? deadlineElement.textContent.trim() : null,
              location: locationElement ? locationElement.textContent.trim() : 'Online',
              description: `Hackathon hosted on Devpost: ${titleElement.textContent.trim()}`
            });
          }
        });
        
        return results;
      });
      
      console.log(`Found ${hackathons.length} hackathons on Devpost`);
      return hackathons;
      
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