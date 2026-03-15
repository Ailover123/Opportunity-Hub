const axios = require('axios');
const path = require('path');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');

// Import specialized scrapers
const CourseraScraper = require('../../scrapers/coursera-scraper');
const IndeedScraper = require('../../scrapers/indeed-scraper');
const DevpostScraper = require('../../scrapers/devpost-scraper');
const KaggleScraper = require('../../scrapers/kaggle-scraper');

class HybridScraper {
    constructor() {
        this.browser = null;
        this.scrapers = {
            coursera: new CourseraScraper(),
            indeed: new IndeedScraper(),
            devpost: new DevpostScraper(),
            kaggle: new KaggleScraper()
        };
    }

    async getBrowser() {
        if (!this.browser) {
            this.browser = await puppeteer.launch({
                headless: "new",
                args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
            });
        }
        return this.browser;
    }

    /**
     * Unified scrape method that routes to the appropriate specialized scraper
     * or uses the internal generic engines.
     */
    async scrape(target) {
        console.log(`[ScraperService] Starting sync for target: ${target}`);
        
        try {
            switch(target.toLowerCase()) {
                case 'unstop':
                    return await this.scrapeUnstop();
                case 'coursera':
                    return await this.scrapers.coursera.scrapeCertifications();
                case 'indeed':
                    return await this.scrapers.indeed.scrapeJobs();
                case 'kaggle':
                    return await this.scrapers.kaggle.scrapeCompetitions();
                case 'devpost':
                    return await this.scrapers.devpost.scrapeHackathons();
                default:
                    console.warn(`[ScraperService] No specialized scraper found for ${target}. Falling back to generic.`);
                    return await this.scrapeGeneric(target);
            }
        } catch (error) {
            console.error(`[ScraperService] Error scraping ${target}:`, error.message);
            return [];
        }
    }

    // FAST: Cheerio for static / server-side rendered sites
    async scrapeStatic(url, selector, mapper) {
        try {
            const { data } = await axios.get(url, {
                headers: { 'User-Agent': 'Mozilla/5.0' },
                timeout: 10000
            });
            const $ = cheerio.load(data);
            const results = [];
            $(selector).each((i, el) => {
                const item = mapper($, el);
                if (item) results.push(item);
            });
            return results;
        } catch (error) {
            console.error(`Static scrape failed for ${url}:`, error.message);
            return [];
        }
    }

    // ROBUST: Puppeteer for dynamic / JS-heavy sites (Infinite Scroll)
    async scrapeDynamic(url, waitSelector, mapper) {
        const browser = await this.getBrowser();
        const page = await browser.newPage();
        try {
            await page.setViewport({ width: 1280, height: 800 });
            await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
            await page.waitForSelector(waitSelector, { timeout: 10000 });

            // INFINITE SCROLL LOGIC
            const items = await page.evaluate(async (selector) => {
                const collected = new Map();
                let lastCount = 0;
                let retries = 0;

                while (collected.size < 60 && retries < 15) {
                    const cards = document.querySelectorAll(selector);
                    cards.forEach(el => {
                        const titleEl = el.querySelector('h3[itemprop="name"]');
                        if (titleEl) {
                            const title = titleEl.innerText.trim();
                            if (!collected.has(title)) {
                                collected.set(title, el.outerHTML);
                            }
                        }
                    });

                    if (collected.size === lastCount) {
                        retries++;
                    } else {
                        lastCount = collected.size;
                        retries = 0;
                    }

                    window.scrollBy(0, 1000);
                    const container = document.querySelector('.listing-container') || document.body;
                    container.scrollTop += 1000;

                    await new Promise(r => setTimeout(r, 1000));
                }
                return Array.from(collected.values());
            }, waitSelector);

            return items.map(html => {
                const $ = cheerio.load(html);
                return mapper($, $('body').children().first());
            }).filter(item => item !== null);

        } catch (error) {
            console.error(`Dynamic scrape failed for ${url}:`, error.message);
            return [];
        } finally {
            await page.close();
        }
    }

    // Unstop Scraper (Optimized with Infinite Scroll)
    async scrapeUnstop() {
        console.log('[Scraper] Syncing Unstop via Infinite Scroll Engine...');
        const url = 'https://unstop.com/hackathons';
        const results = await this.scrapeDynamic(
            url,
            'a.item',
            ($, el) => {
                const $el = $(el);
                const title = $el.find('h3[itemprop="name"]').text().trim();
                const org = $el.find('p.single-wrap').first().text().trim();
                if (!title) return null;

                let rawUrl = $el.attr('href') || '';
                const cleanUrl = rawUrl.startsWith('http') ? rawUrl : `https://unstop.com${rawUrl.startsWith('/') ? '' : '/'}${rawUrl}`;

                return {
                    title,
                    organization: org,
                    deadline: $el.find('.dates-fields label.tag-text').last().text().trim(),
                    url: cleanUrl,
                    source: 'unstop'
                };
            }
        );

        console.log(`[Scraper] Unstop Sync Complete. Total Found: ${results.length}`);
        return results;
    }

    // Generic Scraper (Fast)
    async scrapeGeneric(target) {
        const config = {
            kaggle: {
                url: 'https://www.kaggle.com/competitions',
                selector: '.sc-kOHtZc, div[class*="CompetitionItem"]',
                mapper: ($, el) => ({
                    title: $(el).find('h3').text().trim() || $(el).text().split('\n')[0],
                    organization: 'Kaggle',
                    source: 'kaggle',
                    url: 'https://www.kaggle.com/competitions'
                })
            },
            devpost: {
                url: 'https://devpost.com/hackathons',
                selector: '.hackathon-tile',
                mapper: ($, el) => ({
                    title: $(el).find('h3').text().trim(),
                    organization: $(el).find('.organizer').text().trim(),
                    source: 'devpost',
                    url: $(el).find('a').attr('href')
                })
            }
        };

        if (!config[target]) return [];

        const { url, selector, mapper } = config[target];
        console.log(`[Scraper] Fast-syncing ${target}...`);
        return this.scrapeStatic(url, selector, mapper);
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
        }
        // Also close nested scrapers if they have a close method
        for (const key in this.scrapers) {
            if (this.scrapers[key].close) {
                await this.scrapers[key].close();
            }
        }
    }
}

module.exports = new HybridScraper();
