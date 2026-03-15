const express = require('express');
const router = express.Router();
const opportunityController = require('../controllers/opportunityController');

router.get('/stats', opportunityController.getStats);
router.get('/', opportunityController.getOpportunities);

module.exports = router;
