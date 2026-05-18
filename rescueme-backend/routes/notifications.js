const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");

const { authenticateToken } = require("../middleware/authMiddleware");

// Ensure logged in
router.use(authenticateToken);

router.get("/", notificationController.getNotifications);
router.put("/read", notificationController.markAllRead);
router.put("/:id/dismiss", notificationController.dismissNotification);

module.exports = router;
