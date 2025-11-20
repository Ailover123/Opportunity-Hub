const puppeteer = require('puppeteer');

class IndeedScraper {
  constructor() {
    this.baseUrl = 'https://www.indeed.com/jobs?q=software+developer&l=remote';
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

  async scrapeJobs() {
    try {
      if (!this.page) await this.init();
      
      console.log('Scraping Indeed jobs...');
      await this.page.goto(this.baseUrl, { waitUntil: 'networkidle2', timeout: 30000 });
      
      // Wait for job cards to load
      await this.page.waitForSelector('[data-testid="job-result"]', { timeout: 10000 });
      
      const jobs = await this.page.evaluate(() => {
        const jobCards = document.querySelectorAll('[data-testid="job-result"]');
        const results = [];
        
        jobCards.forEach((card, index) => {
          if (index >= 8) return; // Limit to 8 results
          
          const titleElement = card.querySelector('[data-testid="job-title"] a');
          const companyElement = card.querySelector('[data-testid="company-name"]');
          const locationElement = card.querySelector('[data-testid="job-location"]');
          const salaryElement = card.querySelector('[data-testid="salary-snippet"]');
          const summaryElement = card.querySelector('[data-testid="job-snippet"]');
          
          if (titleElement) {
            results.push({
              title: titleElement.textContent.trim(),
              organization: companyElement ? companyElement.textContent.trim() : 'Unknown Company',
              url: 'https://www.indeed.com' + titleElement.getAttribute('href'),
              prize: salaryElement ? salaryElement.textContent.trim() : null,
              deadline: null,
              location: locationElement ? locationElement.textContent.trim() : 'Remote',
              description: summaryElement ? summaryElement.textContent.trim() : `${titleElement.textContent.trim()} position`
            });
          }
        });
        
        return results;
      });
      
      console.log(`Found ${jobs.length} jobs on Indeed`);
      return jobs;
      
    } catch (error) {
      console.error('Indeed scraping error:', error.message);
      return [];
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

module.exports = IndeedScraper;