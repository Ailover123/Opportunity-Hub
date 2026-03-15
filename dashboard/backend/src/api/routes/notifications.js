const express = require('express');
const router = express.Router();
const notificationService = require('../../services/notificationService');

// Get Notifications for User
router.get('/', async (req, res) => {
    try {
        const notifications = await notificationService.getForUser(req.user.id);

        res.json(notifications);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
