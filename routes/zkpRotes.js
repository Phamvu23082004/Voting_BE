const express = require('express');
const router = express.Router();
const ZKPController = require('../controllers/zkpController');

router.post('/verifyVote', ZKPController.verifyValidVote);
router.post('/verifyCipherAll', ZKPController.verifyValidCipherAll);    