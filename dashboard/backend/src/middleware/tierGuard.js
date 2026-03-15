const tierLimits = {
    free: {
        scrapeInterval: 24 * 60 * 60 * 1000, // 24 hours
        sources: ['devpost', 'kaggle'],
        autoSync: false,
        community: 'read',
        exportFormats: ['csv'],
        maxScrapesPerDay: 5
    },
    pro: {
        scrapeInterval: 6 * 60 * 60 * 1000, // 6 hours
        sources: ['devpost', 'kaggle', 'unstop', 'indeed'],
        autoSync: true,
        community: 'write',
        exportFormats: ['csv', 'pdf', 'xlsx'],
        maxScrapesPerDay: 20
    },
    team: {
        scrapeInterval: 1 * 60 * 60 * 1000, // 1 hour
        sources: ['devpost', 'kaggle', 'unstop', 'indeed', 'coursera'],
        autoSync: true,
        community: 'admin',
        exportFormats: ['all'],
        maxScrapesPerDay: 100
    }
};

const checkTier = (requiredFeature) => {
    return (req, res, next) => {
        const user = req.user;
        if (!user) return res.status(401).json({ error: 'Unauthorized' });

        const plan = user.plan_id || 'free';
        const limits = tierLimits[plan];

        // Specific feature checks
        if (requiredFeature === 'autoSync' && !limits.autoSync) {
            return res.status(403).json({ error: 'Auto-sync is a Pro feature.' });
        }

        if (requiredFeature === 'community_write' && limits.community === 'read') {
            return res.status(403).json({ error: 'Upgrade to join the discussion.' });
        }

        if (requiredFeature === 'export_advanced' && limits.exportFormats.length <= 1) {
            return res.status(403).json({ error: 'Advanced export formats are Pro features.' });
        }

        req.tierLimits = limits;
        next();
    };
};

module.exports = { tierLimits, checkTier };
