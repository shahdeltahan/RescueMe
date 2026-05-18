const express = require("express");
const router = express.Router();
const caseController = require("../controllers/caseController");

const {
  authenticateToken,
  authorizeRoles,
} = require("../middleware/authMiddleware");

router.get("/", authenticateToken, caseController.getCases);
router.get("/:id", authenticateToken, caseController.getCaseById);

router.put(
  "/:id/status",
  authenticateToken,
  authorizeRoles("admin", "volunteer"),
  caseController.updateCaseStatus
);

module.exports = router;