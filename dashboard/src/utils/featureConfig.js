export const FEATURE_CONFIG = {
    highFreqSync: { minPlan: 'pro', label: 'High Frequency Sync' },
    unstopSource: { minPlan: 'pro', label: 'Unstop Scraping' },
    indeedSource: { minPlan: 'pro', label: 'Indeed Job Scraping' },
    courseraSource: { minPlan: 'team', label: 'Coursera Course Scraping' },
    advancedExport: { minPlan: 'pro', label: 'Advanced Export Formats' },
    autoSync: { minPlan: 'pro', label: 'Automatic Background Sync' },
    communityWrite: { minPlan: 'pro', label: 'Join Community Discussions' }
};

export const canAccess = (userPlan, featureId) => {
    const feature = FEATURE_CONFIG[featureId];
    if (!feature) return true;

    const planWeights = { free: 0, pro: 1, team: 2 };
    const userWeight = planWeights[userPlan?.toLowerCase() || 'free'];
    const requiredWeight = planWeights[feature.minPlan];

    return userWeight >= requiredWeight;
};
