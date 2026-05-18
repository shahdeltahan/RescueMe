const express = require("express");
const router = express.Router();
const volunteerController = require("../controllers/volunteerController");

const {
  authenticateToken,
  authorizeRoles,
} = require("../middleware/authMiddleware");

// Ensure only volunteers (or admins) can access these routes
router.use(authenticateToken, authorizeRoles("admin", "volunteer"));

router.get("/cases", volunteerController.getAssignedCases);
router.post("/cases/:reportId/accept", volunteerController.acceptCase);
router.put("/cases/:assignmentId/progress", volunteerController.updateProgress);
router.put("/cases/:assignmentId/close", volunteerController.closeCase);

router.get("/tasks", volunteerController.getTasks);
router.post("/tasks", volunteerController.addTask);
router.put("/tasks/:taskId", volunteerController.toggleTask);

router.get("/vets", volunteerController.getVets);
router.post("/cases/:reportId/assignVet", volunteerController.assignVet);

module.exports = router;
