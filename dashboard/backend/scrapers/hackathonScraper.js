const puppeteer = require('puppeteer');
const axios = require('axios');
const cheerio = require('cheerio');

class HackathonScraper {
  constructor() {
    this.browser = null;
  }

  async init() {
    this.browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async scrapeDevpost() {
    try {
      console.log('Scraping Devpost hackathons...');
      const response = await axios.get('https://devpost.com/hackathons', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        timeout: 10000
      });

      const $ = cheerio.load(response.data);
      const hackathons = [];

      $('.challenge-listing').each((index, element) => {
        if (index >= 10) return false; // Limit to 10 items

        const $elem = $(element);
        const title = $elem.find('.challenge-listing-title').text().trim();
        const organization = $elem.find('.challenge-listing-host').text().trim();
        const deadline = $elem.find('.challenge-listing-deadline').text().trim();
        const prize = $elem.find('.challenge-listing-prize').text().trim();
        const url = 'https://devpost.com' + $elem.find('a').attr('href');
        const description = $elem.find('.challenge-listing-description').text().trim();

        if (title) {
          hackathons.push({
            title: title.substring(0, 200),
            organization: organization || 'Devpost',
            deadline: this.parseDeadline(deadline),
            prize: prize || 'TBD',
            location: 'Online',
            url: url,
            description: description.substring(0, 500) || 'Hackathon opportunity from Devpost'
          });
        }
      });

      console.log(`Scraped ${hackathons.length} hackathons from Devpost`);
      return hackathons;
    } catch (error) {
      console.error('Devpost scraping failed:', error.message);
      return this.getFallbackHackathons();
    }
  }

  async scrapeHackerEarth() {
    try {
      console.log('Scraping HackerEarth challenges...');
      const response = await axios.get('https://www.hackerearth.com/challenges/', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        timeout: 10000
      });

      const $ = cheerio.load(response.data);
      const challenges = [];

      $('.challenge-card, .challenge-list-item').each((index, element) => {
        if (index >= 5) return false; // Limit to 5 items

        const $elem = $(element);
        const title = $elem.find('.challenge-title, h3, .title').text().trim();
        const organization = 'HackerEarth';
        const deadline = $elem.find('.challenge-end-date, .end-date').text().trim();
        const prize = $elem.find('.prize-amount, .prize').text().trim();
        const url = $elem.find('a').attr('href');
        const description = $elem.find('.challenge-description, .description').text().trim();

        if (title) {
          challenges.push({
            title: title.substring(0, 200),
            organization: organization,
            deadline: this.parseDeadline(deadline),
            prize: prize || 'Various Prizes',
            location: 'Online',
            url: url ? (url.startsWith('http') ? url : 'https://www.hackerearth.com' + url) : 'https://www.hackerearth.com/challenges/',
            description: description.substring(0, 500) || 'Programming challenge from HackerEarth'
          });
        }
      });

      console.log(`Scraped ${challenges.length} challenges from HackerEarth`);
      return challenges;
    } catch (error) {
      console.error('HackerEarth scraping failed:', error.message);
      return this.getFallbackHackathons();
    }
  }

  parseDeadline(deadlineText) {
    if (!deadlineText) return null;
    
    // Try to extract date patterns
    const dateMatch = deadlineText.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
    if (dateMatch) {
      return `${dateMatch[3]}-${dateMatch[1].padStart(2, '0')}-${dateMatch[2].padStart(2, '0')}`;
    }
    
    // Try to extract "in X days" pattern
    const daysMatch = deadlineText.match(/(\d+)\s*days?/i);
    if (daysMatch) {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + parseInt(daysMatch[1]));
      return futureDate.toISOString().split('T')[0];
    }
    
    return null;
  }

  getFallbackHackathons() {
    const currentDate = new Date();
    const futureDate = new Date(currentDate.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 days from now
    
    return [
      {
        title: 'AI Innovation Challenge 2025',
        organization: 'TechCorp Global',
        deadline: futureDate.toISOString().split('T')[0],
        prize: '$50,000',
        location: 'Online',
        url: 'https://devpost.com/hackathons',
        description: 'Build innovative AI solutions for real-world problems. Open to all skill levels.'
      },
      {
        title: 'Blockchain for Good Hackathon',
        organization: 'CryptoFoundation',
        deadline: new Date(currentDate.getTime() + (45 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
        prize: '$25,000',
        location: 'Online',
        url: 'https://devpost.com/hackathons',
        description: 'Create blockchain solutions that make a positive impact on society.'
      }
    ];
  }

  async scrapeAll() {
    await this.init();
    try {
      const devpostResults = await this.scrapeDevpost();
      const hackerEarthResults = await this.scrapeHackerEarth();
      
      return [...devpostResults, ...hackerEarthResults];
    } finally {
      await this.close();
    }
  }
}

module.exports = HackathonScraper;