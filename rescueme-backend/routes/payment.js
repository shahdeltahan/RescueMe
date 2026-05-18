const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");

const {
  authenticateToken,
  authorizeRoles,
} = require("../middleware/authMiddleware");

router.post("/", authenticateToken, paymentController.processPayment);
router.get("/my", authenticateToken, paymentController.getMyPayments);

router.get(
  "/",
  authenticateToken,
  authorizeRoles("admin"),
  paymentController.getAllPayments
);

router.post("/:id/refund", authenticateToken, paymentController.refundPayment);

module.exports = router;