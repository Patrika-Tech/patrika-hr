'use strict';
const express     = require('express');
const router      = express.Router();
const testController = require('../controllers/testController');
const { requireAdmin } = require('../middleware/auth');

// Public — candidate-facing
router.get('/test/:token',        testController.showTest);
router.post('/test/:token/submit', testController.submitTest);

// Admin — protected
router.post('/admin/candidate/:id/send-test',  requireAdmin, testController.sendTest);
router.get('/admin/test-result/:testId',        requireAdmin, testController.viewResult);
router.get('/admin/candidate/:id/tests',        requireAdmin, testController.listTests);

module.exports = router;
