const { db } = require('../../utils/db');

exports.getStats = (req, res) => {
    const userId = req.user.id;
    const queries = [
        `SELECT COUNT(*) as total FROM opportunities WHERE user_id = ?`,
        `SELECT category, COUNT(*) as count FROM opportunities WHERE user_id = ? GROUP BY category`
    ];

    Promise.all(queries.map(query =>
        new Promise((resolve, reject) => {
            db.all(query, [userId], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        })
    )).then(results => {
        res.json({
            total: results[0][0]?.total || 0,
            categories: results[2].reduce((acc, row) => {
                acc[row.category] = row.count;
                return acc;
            }, {})
        });
    }).catch(err => res.status(500).json({ error: err.message }));
};


exports.getOpportunities = (req, res) => {
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

    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
};
