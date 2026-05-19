const pool = require("../db");
const notificationService = require("../services/notificationService");

function getUserId(req) {
  return req.user?.user_id || req.user?.id || req.user?.userId;
}

const adoptionController = {
  getAdoptionPets: async (req, res) => {
    try {
      const [rows] = await pool.query(`
        SELECT 
          cr.report_id AS id,
          cr.animal_type AS name,
          cr.animal_condition AS breed,
          l.address_description AS location,
          cr.image_url AS image,
          rs.status_name AS status,
          cr.reported_by AS owner,
          an.estimated_age,
          an.gender AS animal_gender,
          IF(ar.adoption_request_id IS NOT NULL, true, false) AS adopted
        FROM CASE_REPORT cr
        LEFT JOIN REPORT_STATUS rs ON cr.status_id = rs.status_id
        LEFT JOIN REPORT_LOCATION rl ON cr.report_id = rl.report_id
        LEFT JOIN LOCATION l ON rl.location_id = l.location_id
        LEFT JOIN ANIMAL an ON cr.report_id = an.report_id
        LEFT JOIN ADOPTION_REQUEST ar ON ar.report_id = cr.report_id AND ar.status_id IN (3,4) -- Pending or Adopted
        WHERE rs.status_name = 'resolved' OR ar.adoption_request_id IS NOT NULL
        ORDER BY cr.report_id DESC
      `);

      // map to what frontend expects
      const pets = rows.map(r => ({
        id: r.id,
        name: r.name || 'Adoptable Friend',
        breed: r.location || 'Unknown Location',
        species: (r.name || '').toLowerCase().includes('cat') ? 'cat' : 'dog',
        age: r.estimated_age ? `${r.estimated_age} years` : 'Unknown Age',
        gender: r.animal_gender || 'Unknown',
        owner: r.owner || 'Rescued',
        status: r.status === 'resolved' ? 'Stable' : (r.status || 'Stable'),
        image: r.image || 'https://images.unsplash.com/photo-1543852786-1cf6624b9987?auto=format&fit=crop&q=80&w=400',
        adopted: r.adopted === 1
      }));

      res.json(pets);
    } catch (error) {
      console.error("Get adoption pets error:", error);
      res.status(500).json({ error: error.message });
    }
  },

  requestAdoption: async (req, res) => {
    try {
      const userId = getUserId(req);
      const { reportId } = req.params;

      const [existing] = await pool.query(
        "SELECT * FROM ADOPTION_REQUEST WHERE report_id = ? AND user_id = ?",
        [reportId, userId]
      );

      if (existing.length > 0) {
        return res.status(400).json({ error: "You have already applied to adopt this pet." });
      }

      await pool.query(
        "INSERT INTO ADOPTION_REQUEST (user_id, report_id, status_id) VALUES (?, ?, 3)", // 3 = pending
        [userId, reportId]
      );

      // We leave the case open (resolved) so the volunteer can close it later.

      // Notify volunteers who were assigned to this case
      const [volunteers] = await pool.query(
        "SELECT DISTINCT volunteer_id FROM volunteer_case_assignment WHERE report_id = ?",
        [reportId]
      );
      
      const [caseRows] = await pool.query(
        "SELECT animal_type FROM CASE_REPORT WHERE report_id = ?",
        [reportId]
      );
      const animalType = caseRows[0]?.animal_type || "animal";

      for (const vol of volunteers) {
        await notificationService.createNotification(
          vol.volunteer_id,
          "alert",
          "New Adoption Request",
          "10. New adoption application received\n11. Adoption application waiting for volunteer decision"
        );
      }

      await notificationService.notifyAdmins('alert', 'New Adoption Request', '11. New adoption application submitted');
      if (userId) {
          await notificationService.createNotification(userId, 'system', 'Adoption Request Submitted', '2. Adoption application submitted\n3. Adoption application waiting for volunteer review');
      }

      res.json({ message: "Adoption request submitted successfully." });
    } catch (error) {
      console.error("Request adoption error:", error);
      res.status(500).json({ error: error.message });
    }
  },

  respondAdoption: async (req, res) => {
    try {
      const volunteerId = getUserId(req);
      const { requestId } = req.params;
      const { status } = req.body; // 'accepted' or 'rejected'

      if (status !== 'accepted' && status !== 'rejected') {
        return res.status(400).json({ error: "Status must be 'accepted' or 'rejected'" });
      }

      const statusId = status === 'accepted' ? 4 : 5; // Assuming 4 is approved, 5 is rejected

      const [result] = await pool.query(
        "UPDATE ADOPTION_REQUEST SET status_id = ? WHERE adoption_request_id = ?",
        [statusId, requestId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Adoption request not found." });
      }

      // Fetch details for notifications
      const [requestRows] = await pool.query(
        "SELECT user_id, report_id FROM ADOPTION_REQUEST WHERE adoption_request_id = ?",
        [requestId]
      );

      if (requestRows.length > 0) {
        const adopterId = requestRows[0].user_id;
        const reportId = requestRows[0].report_id;

        await notificationService.notifyAdmins('update', 'Adoption Response', '12. Adoption application accepted / rejected by volunteer');
        
        if (volunteerId) {
            let volMessage = '12. Adoption application accepted / rejected';
            if (status === 'accepted') volMessage += '\n13. Case ready to be closed after adoption';
            await notificationService.createNotification(volunteerId, 'update', 'Adoption Response', volMessage);
        }

        if (adopterId) {
            let adopterMessage = '4. Adoption application accepted / rejected';
            if (status === 'accepted') adopterMessage += '\n5. Adoption confirmed';
            await notificationService.createNotification(adopterId, 'alert', 'Adoption Update', adopterMessage);
        }
      }

      res.json({ message: `Adoption request ${status}.` });
    } catch (error) {
      console.error("Respond adoption error:", error);
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = adoptionController;
