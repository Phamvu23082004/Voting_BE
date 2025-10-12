const express = require("express");
const router = express.Router();
const voterController = require("../controllers/voterController");
const {
  authMiddleware,
  requireRole,
} = require("../middlewares/authMiddleware");

router.post(
  "/register",
  // authMiddleware,
  // requireRole("CA"),
  voterController.registerVoter
);

router.get("/challenge", voterController.getChallenge);
router.post("/verify", voterController.verifyLogin);
router.post("/refresh-token", voterController.refreshToken);

module.exports = router;
