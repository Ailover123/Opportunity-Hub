const fs = require('fs');
const path = require('path');
const { createObjectCsvWriter } = require('csv-writer');

class SheetService {
    async generateOpportunityCsv(userId, opportunities) {
        const exportDir = path.join(process.cwd(), 'exports');
        if (!fs.existsSync(exportDir)) fs.mkdirSync(exportDir, { recursive: true });

        const fileName = `opps_${userId}_${Date.now()}.csv`;
        const filePath = path.join(exportDir, fileName);




        const csvWriter = createObjectCsvWriter({
            path: filePath,
            header: [
                { id: 'title', title: 'Opportunity Name' },
                { id: 'organization', title: 'Organization' },
                { id: 'deadline', title: 'Deadline' },
                { id: 'source', title: 'Source' },
                { id: 'status', title: 'Status' },
                { id: 'created_at', title: 'Collected At' }
            ]
        });

        await csvWriter.writeRecords(opportunities);
        return { filePath, fileName };
    }
}

module.exports = new SheetService();
