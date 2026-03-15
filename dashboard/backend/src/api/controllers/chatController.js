const { db } = require('../../utils/db');
const { v4: uuidv4 } = require('uuid');

exports.getMessages = (req, res) => {
    const { teamId } = req.params;
    db.all(`
        SELECT m.*, u.name as user_name, u.avatar_url 
        FROM messages m 
        JOIN users u ON m.user_id = u.id 
        WHERE m.team_id = ? 
        ORDER BY m.created_at ASC
    `, [teamId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
};

exports.postMessage = (req, res) => {
    const userId = req.user.id;
    const { teamId, content } = req.body;
    const id = uuidv4();

    db.run('INSERT INTO messages (id, team_id, user_id, content) VALUES (?, ?, ?, ?)',
        [id, teamId, userId, content],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id, userId, teamId, content, created_at: new Date().toISOString() });
        }
    );
};
