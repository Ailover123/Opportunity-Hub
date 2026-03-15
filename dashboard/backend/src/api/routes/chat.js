const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

router.get('/:teamId', chatController.getMessages);
router.post('/', chatController.postMessage);

module.exports = router;
