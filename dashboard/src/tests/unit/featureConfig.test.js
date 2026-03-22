import { describe, it, expect } from 'vitest';
import { canAccess } from '../../utils/featureConfig';

describe('featureConfig (Frontend)', () => {
    it('should return true for free access features regardless of plan', () => {
        expect(canAccess('free', 'dashboard')).toBe(true);
        expect(canAccess('pro', 'dashboard')).toBe(true);
        expect(canAccess('team', 'dashboard')).toBe(true);
    });

    it('should block pro features for free users', () => {
        expect(canAccess('free', 'autoSync')).toBe(false);
    });

    it('should allow pro features for pro and team users', () => {
        expect(canAccess('pro', 'autoSync')).toBe(true);
        expect(canAccess('team', 'autoSync')).toBe(true);
    });

    it('should block team features for pro users', () => {
        expect(canAccess('pro', 'courseraSource')).toBe(false);
    });

    it('should allow team features for team users', () => {
        expect(canAccess('team', 'courseraSource')).toBe(true);
    });
});
