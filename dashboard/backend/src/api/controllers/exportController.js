const { db } = require('../../utils/db');
const sheetService = require('../../services/sheetService');
const path = require('path');
const fs = require('fs');

exports.exportToCsv = async (req, res) => {
    const userId = req.user.id;
    const { categories } = req.body;

    try {
        let query = 'SELECT * FROM opportunities WHERE user_id = ?';
        let params = [userId];

        if (categories && categories.length > 0) {
            query += ` AND category IN (${categories.map(() => '?').join(',')})`;
            params.push(...categories);
        }

        const data = await db.all(query, params);

        if (data.length === 0) return res.status(404).json({ error: 'No data found' });

        const { filePath, fileName } = await sheetService.generateOpportunityCsv(userId, data);

        res.json({
            success: true,
            fileName,
            downloadUrl: `/api/export/download/${fileName}`
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.downloadFile = (req, res) => {
    const { filename } = req.params;
    const filepath = path.join(process.cwd(), 'exports', filename);


    if (fs.existsSync(filepath)) {
        res.download(filepath);
    } else {
        res.status(404).json({ error: 'File not found' });
    }
};
