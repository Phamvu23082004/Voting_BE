const express = require("express");
const router = express.Router();
const controller = require("../controllers/organizationController");
const {
  authMiddleware,
  requireRole,
} = require("../middlewares/authMiddleware");

router.get("/", authMiddleware, requireRole("CA"), controller.getOrganizations);

router.post(
  "/register-trustee",
  authMiddleware,
  requireRole("CA"),
  controller.registerTrustee
);

router.post("/login", controller.loginOrganization);

router.delete(
  "/:id",
  authMiddleware,
  requireRole("CA"),
  controller.deleteOrganization
);

router.delete(
  "/delete-all",
  authMiddleware,
  requireRole("CA"),
  controller.deleteAllOrganizations
);

module.exports = router;
