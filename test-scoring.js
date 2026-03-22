const ScoringEngine = require('./dashboard/backend/src/services/scoringEngine');

const mockUser = {
    skills: ['React', 'Node.js', 'ML'],
    interests: ['Hackathons', 'Internships']
};

const mockOpportunities = [
    {
        id: '1',
        title: 'React Developer Internship',
        organization: 'Tech Corp',
        deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days away
        source: 'unstop',
        category: 'Development',
        collected_at: new Date().toISOString()
    },
    {
        id: '2',
        title: 'ML Challenge',
        organization: 'AI Lab',
        deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days away
        source: 'devpost',
        category: 'Competition',
        collected_at: new Date().toISOString()
    },
    {
        id: '3',
        title: 'Old Hackathon',
        organization: 'Historic Soc',
        deadline: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        source: 'kaggle',
        category: 'Hackathon',
        collected_at: new Date().toISOString()
    }
];

const engine = new ScoringEngine(mockUser);
const result = engine.rank(mockOpportunities);

console.log('--- Ranked Results ---');
console.log(JSON.stringify(result, null, 2));

if (result.data.length === 2 && result.data[0].title.includes('React')) {
    console.log('\x1b[32m✔ Verification Passed: Expired excluded, React ranked #1\x1b[0m');
} else {
    console.log('\x1b[31m✘ Verification Failed\x1b[0m');
}
