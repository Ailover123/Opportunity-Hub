const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { db } = require('../../utils/db');

// Create a Team
router.post('/teams', (req, res) => {
    const { name } = req.body;
    const owner_id = req.user.id;
    const id = uuidv4();

    db.run('INSERT INTO teams (id, name, owner_id) VALUES (?, ?, ?)', [id, name, owner_id], (err) => {
        if (err) return res.status(500).json({ error: err.message });

        db.run('INSERT INTO team_members (team_id, user_id, role) VALUES (?, ?, ?)', [id, owner_id, 'admin'], (err2) => {
            if (err2) return res.status(500).json({ error: err2.message });
            res.json({ success: true, teamId: id });
        });
    });
});


// Get My Teams
router.get('/my-teams', (req, res) => {
    const userId = req.user.id;
    const query = `
    SELECT t.*, tm.role 
    FROM teams t 
    JOIN team_members tm ON t.id = tm.team_id 
    WHERE tm.user_id = ?
  `;
    db.all(query, [userId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});


// Post to Discussion
router.post('/discussions', (req, res) => {
    const { team_id, content } = req.body;
    const user_id = req.user.id;
    const id = uuidv4();

    db.run('INSERT INTO messages (id, team_id, user_id, content) VALUES (?, ?, ?, ?)',
        [id, team_id, user_id, content],
        (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, discussionId: id });
        }
    );
});

// Get Team Discussions
router.get('/discussions/:teamId', (req, res) => {
    const { teamId } = req.params;
    const query = `
    SELECT m.*, u.name as user_name, u.avatar_url as user_picture 
    FROM messages m 
    JOIN users u ON m.user_id = u.id 
    WHERE m.team_id = ? 
    ORDER BY m.created_at DESC
  `;
    db.all(query, [teamId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});


module.exports = router;
