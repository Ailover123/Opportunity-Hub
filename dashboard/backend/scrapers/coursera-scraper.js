const puppeteer = require('puppeteer');

class CourseraScraper {
  constructor() {
    this.baseUrl = 'https://www.coursera.org/courses?query=free';
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

  async scrapeCertifications() {
    try {
      if (!this.page) await this.init();
      
      console.log('Scraping Coursera free courses...');
      await this.page.goto(this.baseUrl, { waitUntil: 'networkidle2', timeout: 30000 });
      
      // Wait for course cards to load
      await this.page.waitForSelector('[data-testid="search-results-list"]', { timeout: 10000 });
      
      const courses = await this.page.evaluate(() => {
        const courseCards = document.querySelectorAll('[data-testid="search-results-list"] > div');
        const results = [];
        
        courseCards.forEach((card, index) => {
          if (index >= 6) return; // Limit to 6 results
          
          const titleElement = card.querySelector('h3 a');
          const providerElement = card.querySelector('[data-testid="partner-name"]');
          const ratingElement = card.querySelector('[data-testid="ratings-text"]');
          
          if (titleElement) {
            results.push({
              title: titleElement.textContent.trim(),
              organization: providerElement ? providerElement.textContent.trim() : 'Coursera',
              url: 'https://www.coursera.org' + titleElement.getAttribute('href'),
              prize: null,
              deadline: null,
              location: 'Online',
              description: `Free online course: ${titleElement.textContent.trim()}`,
              rating: ratingElement ? ratingElement.textContent.trim() : null
            });
          }
        });
        
        return results;
      });
      
      console.log(`Found ${courses.length} free courses on Coursera`);
      return courses;
      
    } catch (error) {
      console.error('Coursera scraping error:', error.message);
      return [];
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

module.exports = CourseraScraper;