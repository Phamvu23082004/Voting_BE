const express = require('express');
const router = express.Router();
const voterController = require('../controllers/voterController');

// Route POST /voter/register
router.post('/register', voterController.registerVoter);

router.get("/challenge", voterController.getChallenge);
router.post("/verify", voterController.verifyLogin);
router.post("/refresh_token", voterController.refreshToken);

module.exports = router;
