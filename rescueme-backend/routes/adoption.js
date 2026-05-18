const express = require("express");
const router = express.Router();
const adoptionController = require("../controllers/adoptionController");

const {
  authenticateToken
} = require("../middleware/authMiddleware");

// Ensure logged in
router.use(authenticateToken);

router.get("/pets", adoptionController.getAdoptionPets);
router.post("/request/:reportId", adoptionController.requestAdoption);
router.put("/request/:requestId/respond", adoptionController.respondAdoption);

module.exports = router;