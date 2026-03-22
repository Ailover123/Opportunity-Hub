const { db } = require('../../utils/db');
const { v4: uuidv4 } = require('uuid');

exports.getStats = async (req, res) => {
    const userId = req.user.id;
    try {
        const totalRows = await db.all(`SELECT COUNT(*) as total FROM opportunities WHERE user_id = ?`, [userId]);
        const categoryRows = await db.all(`SELECT category, COUNT(*) as count FROM opportunities WHERE user_id = ? GROUP BY category`, [userId]);

        res.json({
            total: totalRows[0]?.total || 0,
            categories: categoryRows.reduce((acc, row) => {
                acc[row.category] = row.count;
                return acc;
            }, {})
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


exports.getOpportunities = async (req, res) => {
    const userId = req.user.id;
    const { category, limit = 50 } = req.query;
    let query = 'SELECT * FROM opportunities WHERE user_id = ?';
    let params = [userId];

    if (category) {
        query += ' AND category = ?';
        params.push(category);
    }

    query += ' ORDER BY collected_at DESC LIMIT ?';
    params.push(parseInt(limit));

    try {
        const rows = await db.all(query, params);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.logClick = async (req, res) => {
    const userId = req.user.id;
    const { id } = req.params;
    const { score, rank } = req.body;

    try {
        await db.run(
            'INSERT INTO user_feedback (id, user_id, opportunity_id, feedback_type, score, `rank`) VALUES (?, ?, ?, ?, ?, ?)',
            [uuidv4(), userId, id, 'click', score || 0, rank || 0]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
