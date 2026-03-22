import { describe, it, expect, vi } from 'vitest';
const { checkTier, tierLimits } = require('../../middleware/tierGuard');

describe('tierGuard Middleware', () => {
    const mockRes = () => {
        const res = {};
        res.status = vi.fn().mockReturnValue(res);
        res.json = vi.fn().mockReturnValue(res);
        return res;
    };

    const mockNext = vi.fn();

    it('should block unauthorized users', () => {
        const req = {};
        const res = mockRes();
        const next = mockNext;

        checkTier()(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
    });

    it('should allow free users to access basic features', () => {
        const req = { user: { plan_id: 'free' } };
        const res = mockRes();
        const next = mockNext;

        checkTier()(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(req.tierLimits).toEqual(tierLimits.free);
    });

    it('should block free users from autoSync', () => {
        const req = { user: { plan_id: 'free' } };
        const res = mockRes();
        const next = mockNext;

        checkTier('autoSync')(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({ error: 'Auto-sync is a Pro feature.' });
    });

    it('should allow pro users to autoSync', () => {
        const req = { user: { plan_id: 'pro' } };
        const res = mockRes();
        const next = mockNext;

        checkTier('autoSync')(req, res, next);

        expect(next).toHaveBeenCalled();
    });

    it('should block community write for free users', () => {
        const req = { user: { plan_id: 'free' } };
        const res = mockRes();
        const next = mockNext;

        checkTier('community_write')(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
    });

    it('should allow team users full access', () => {
        const req = { user: { plan_id: 'team' } };
        const res = mockRes();
        const next = mockNext;

        checkTier('community_write')(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(req.tierLimits).toEqual(tierLimits.team);
    });
});
