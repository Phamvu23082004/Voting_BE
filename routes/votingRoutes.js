const express = require("express");
const router = express.Router();
const { submitVote, tallyVotes } = require("../controllers/votingController");

router.post("/vote", submitVote);
router.post("/tally", tallyVotes);

module.exports = router;
