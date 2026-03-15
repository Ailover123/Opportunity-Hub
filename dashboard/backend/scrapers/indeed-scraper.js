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
      // Indeed is very bot-sensitive. We need to be careful.
      await this.page.goto(this.baseUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });

      // Wait for job cards - Increased timeout
      try {
        await this.page.waitForSelector('.job_seen_beacon, [data-testid="job-result"]', { timeout: 20000 });
      } catch (e) {
        console.log("Could not find standard Indeed selector. They might have rotated class names.");
      }

      const jobs = await this.page.evaluate(() => {
        // Try multiple potential selectors for indeed job cards
        const jobCards = document.querySelectorAll('.job_seen_beacon, [data-testid="job-result"], tr.jobtable');
        const results = [];

        jobCards.forEach((card, index) => {
          if (index >= 8) return;

          // Try to find title
          let titleEl = card.querySelector('h2.jobTitle span, .jobTitle a');
          // Try to find company
          let companyEl = card.querySelector('[data-testid="company-name"], .companyName');

          if (titleEl) {
            const title = titleEl.textContent.trim();
            const company = companyEl ? companyEl.textContent.trim() : 'Indeed Listing';
            // URL is often on the `a` tag up the tree or inside the h2
            const urlAnchor = card.closest('a') || card.querySelector('a');
            let url = urlAnchor ? urlAnchor.getAttribute('href') : '';
            if (url && !url.startsWith('http')) url = 'https://www.indeed.com' + url;

            results.push({
              title: title,
              organization: company,
              url: url || 'https://www.indeed.com',
              prize: 'Job Salary',
              deadline: null,
              location: 'Remote',
              description: `${title} at ${company}`,
              status: 'pending',
              quality_score: 70
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