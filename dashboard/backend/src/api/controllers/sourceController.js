const { db } = require('../../utils/db');
const { v4: uuidv4 } = require('uuid');

exports.getSources = (req, res) => {
    const userId = req.user.id;
    db.all('SELECT * FROM data_sources WHERE user_id = ? ORDER BY created_at DESC', [userId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
};

exports.addSource = (req, res) => {
    const userId = req.user.id;
    const { name, url, type } = req.body;
    const id = uuidv4();

    db.run(
        'INSERT INTO data_sources (id, user_id, name, url, type) VALUES (?, ?, ?, ?, ?)',
        [id, userId, name, url, type],
        (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id, name, url, type, active: true });
        }
    );
};

exports.toggleSource = (req, res) => {
    const { id } = req.params;
    const { active } = req.body;
    db.run('UPDATE data_sources SET active = ? WHERE id = ?', [active ? 1 : 0, id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
};
