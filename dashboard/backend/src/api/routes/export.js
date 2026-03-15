const express = require('express');
const router = express.Router();
const exportController = require('../controllers/exportController');

router.post('/', exportController.exportToCsv);
router.get('/download/:filename', exportController.downloadFile);

module.exports = router;
