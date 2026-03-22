const { db } = require('../../utils/db');

exports.getProfile = async (req, res) => {
    const userId = req.user.id;
    try {
        const user = await db.get('SELECT id, email, name, bio, skills, github_url, avatar_url, plan_id FROM users WHERE id = ?', [userId]);
        if (!user) {
            return res.json(req.user);
        }
        res.json(user);
    } catch (err) {
        res.json(req.user);
    }
};


exports.updateProfile = async (req, res) => {
    const userId = req.user.id;
    const { name, bio, skills, github_url, avatar_url } = req.body;

    try {
        await db.run(
            'UPDATE users SET name = ?, bio = ?, skills = ?, github_url = ?, avatar_url = ? WHERE id = ?',
            [name, bio, skills, github_url, avatar_url, userId]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
