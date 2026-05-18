const express = require("express");
const router = express.Router();
const reportController = require("../controllers/reportController");

const {
  authenticateToken,
} = require("../middleware/authMiddleware");

router.post("/", authenticateToken, reportController.createReport);
router.get("/", authenticateToken, reportController.getReports);

module.exports = router;