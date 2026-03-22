const { db } = require('../../utils/db');

exports.getSchedule = async (req, res) => {
    const userId = req.user.id;
    try {
        const row = await db.get('SELECT * FROM schedules WHERE user_id = ?', [userId]);
        res.json(row || { enabled: false });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateSchedule = async (req, res) => {
    const userId = req.user.id;
    const { frequency, time, enabled } = req.body;

    try {
        await db.run(
            `INSERT INTO schedules (id, user_id, frequency, time, enabled) 
             VALUES (?, ?, ?, ?, ?) 
             ON DUPLICATE KEY UPDATE 
                frequency=VALUES(frequency), 
                time=VALUES(time), 
                enabled=VALUES(enabled)`,
            [userId, userId, frequency, time, enabled ? 1 : 0]
        );
        res.json({ success: true, message: 'Schedule updated successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
