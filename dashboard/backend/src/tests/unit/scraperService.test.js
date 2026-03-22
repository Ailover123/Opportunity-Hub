import { describe, it, expect, vi, beforeEach } from 'vitest';
const scraperService = require('../../services/scraperService');

describe('scraperService', () => {
    beforeEach(() => {
        // Mock the internal scrapers on the instance
        scraperService.scrapers.coursera = { 
            scrapeCertifications: vi.fn().mockResolvedValue([{ title: 'Coursera Course' }]) 
        };
        scraperService.scrapers.devpost = { 
            scrapeHackathons: vi.fn().mockResolvedValue([{ title: 'Devpost Hackathon' }]) 
        };
    });

    it('should route to the correct scraper based on target', async () => {
        const courseraResult = await scraperService.scrape('coursera');
        expect(courseraResult).toEqual([{ title: 'Coursera Course' }]);

        const devpostResult = await scraperService.scrape('devpost');
        expect(devpostResult).toEqual([{ title: 'Devpost Hackathon' }]);
    });

    it('should return empty array for unknown target', async () => {
        const result = await scraperService.scrape('unknown');
        expect(result).toEqual([]);
    });
});
