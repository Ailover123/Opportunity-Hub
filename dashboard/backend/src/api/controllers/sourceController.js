const { db } = require('../../utils/db');
const { v4: uuidv4 } = require('uuid');

exports.getSources = async (req, res) => {
    const userId = req.user.id;
    try {
        const rows = await db.all('SELECT * FROM data_sources WHERE user_id = ? ORDER BY created_at DESC', [userId]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.addSource = async (req, res) => {
    const userId = req.user.id;
    const { name, url, type } = req.body;
    const id = uuidv4();

    try {
        await db.run(
            'INSERT INTO data_sources (id, user_id, name, url, type) VALUES (?, ?, ?, ?, ?)',
            [id, userId, name, url, type]
        );
        res.json({ id, name, url, type, active: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.toggleSource = async (req, res) => {
    const { id } = req.params;
    const { active } = req.body;
    try {
        await db.run('UPDATE data_sources SET active = ? WHERE id = ?', [active ? 1 : 0, id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
