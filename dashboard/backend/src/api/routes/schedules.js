const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');

router.get('/', scheduleController.getSchedule);
router.post('/', scheduleController.updateSchedule);

module.exports = router;
