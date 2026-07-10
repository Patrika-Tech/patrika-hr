'use strict';
const express        = require('express');
const router         = express.Router();
const testController = require('../controllers/testController');

// Public — candidate-facing only
router.get('/test/:token',         testController.showTest);
router.post('/test/:token/submit', testController.submitTest);

module.exports = router;
