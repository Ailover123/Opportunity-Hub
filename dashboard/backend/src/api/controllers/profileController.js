const { db } = require('../../utils/db');

exports.getProfile = (req, res) => {
    const userId = req.user.id;
    db.get('SELECT id, email, name, bio, skills, github_url, avatar_url, plan_id FROM users WHERE id = ?', [userId], (err, user) => {
        if (err || !user) {
            // Fallback to the user object attached by authenticateToken middleware
            return res.json(req.user);
        }
        res.json(user);
    });
};


exports.updateProfile = (req, res) => {
    const userId = req.user.id;
    const { name, bio, skills, github_url, avatar_url } = req.body;

    db.run(
        'UPDATE users SET name = ?, bio = ?, skills = ?, github_url = ?, avatar_url = ? WHERE id = ?',
        [name, bio, skills, github_url, avatar_url, userId],
        (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        }
    );
};
