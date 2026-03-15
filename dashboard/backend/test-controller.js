const { db } = require('./src/utils/db');
const controller = require('./src/api/controllers/opportunityController');

// Mock req/res
const req = {
    user: { id: '579f546b-f8c5-4d28-934f-3a0cc4719fd2' },
    query: { limit: 10 }
};

const res = {
    status: function (code) {
        console.log('Status:', code);
        return this;
    },
    json: function (data) {
        console.log('JSON Data:', JSON.stringify(data, null, 2));
    }
};

console.log('Testing getOpportunities...');
controller.getOpportunities(req, res);

// Wait for a bit for the async DB call
setTimeout(() => {
    console.log('Testing getStats...');
    controller.getStats(req, res);
}, 2000);

setTimeout(() => process.exit(0), 5000);
