const express = require('express');
const router = express.Router();
const sourceController = require('../controllers/sourceController');

router.get('/', sourceController.getSources);
router.post('/', sourceController.addSource);
router.patch('/:id', sourceController.toggleSource);

module.exports = router;
