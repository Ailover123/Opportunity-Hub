const { db } = require('../../utils/db');

exports.getSchedule = (req, res) => {
    const userId = req.user.id;
    db.get('SELECT * FROM schedules WHERE user_id = ?', [userId], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(row || { enabled: false });
    });
};

exports.updateSchedule = (req, res) => {
    const userId = req.user.id;
    const { frequency, time, enabled } = req.body;

    db.run(
        `INSERT INTO schedules (id, user_id, frequency, time, enabled) 
         VALUES (?, ?, ?, ?, ?) 
         ON CONFLICT(id) DO UPDATE SET 
            frequency=excluded.frequency, 
            time=excluded.time, 
            enabled=excluded.enabled`,
        [userId, userId, frequency, time, enabled ? 1 : 0],
        (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, message: 'Schedule updated successfully' });
        }
    );
};
