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
      await this.page.goto(this.baseUrl, { waitUntil: 'networkidle2', timeout: 30000 });
      
      // Wait for competition cards to load
      await this.page.waitForSelector('[data-testid="competition-list-item"]', { timeout: 10000 });
      
      const competitions = await this.page.evaluate(() => {
        const items = document.querySelectorAll('[data-testid="competition-list-item"]');
        const results = [];
        
        items.forEach((item, index) => {
          if (index >= 8) return; // Limit to 8 results
          
          const titleElement = item.querySelector('a[data-testid="competition-list-item-title"]');
          const prizeElement = item.querySelector('[data-testid="competition-list-item-reward"]');
          const deadlineElement = item.querySelector('[data-testid="competition-list-item-deadline"]');
          const participantsElement = item.querySelector('[data-testid="competition-list-item-entrants"]');
          
          if (titleElement) {
            results.push({
              title: titleElement.textContent.trim(),
              organization: 'Kaggle',
              url: 'https://www.kaggle.com' + titleElement.getAttribute('href'),
              prize: prizeElement ? prizeElement.textContent.trim() : 'Knowledge & Recognition',
              deadline: deadlineElement ? deadlineElement.textContent.trim() : null,
              location: 'Online',
              description: `Kaggle machine learning competition: ${titleElement.textContent.trim()}`,
              participants: participantsElement ? participantsElement.textContent.trim() : null
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