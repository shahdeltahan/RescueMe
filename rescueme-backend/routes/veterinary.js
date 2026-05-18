const express = require("express");
const router = express.Router();
const veterinaryController = require("../controllers/veterinaryController");

const { authenticateToken, authorizeRoles } = require("../middleware/authMiddleware");

// Ensure logged in and role
router.use(authenticateToken, authorizeRoles("admin", "vet"));

router.get("/patients", veterinaryController.getPatients);
router.put("/patients/:id/status", veterinaryController.updatePatientStatus);

router.get("/appointments", veterinaryController.getAppointments);
router.post("/appointments", veterinaryController.addAppointment);
router.delete("/appointments/:id", veterinaryController.deleteAppointment);

module.exports = router;
