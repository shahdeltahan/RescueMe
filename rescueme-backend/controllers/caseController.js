const pool = require("../db");
const notificationService = require("../services/notificationService");

async function getStatusId(statusName) {
  const [rows] = await pool.query(
    "SELECT status_id FROM REPORT_STATUS WHERE LOWER(status_name) = LOWER(?) LIMIT 1",
    [statusName]
  );

  if (rows.length === 0) {
    return null;
  }

  return rows[0].status_id;
}

const caseController = {
  getCases: async (req, res) => {
    try {
      const [rows] = await pool.query(
        `SELECT
          cr.report_id,
          cr.description,
          cr.animal_type,
          cr.animal_condition,
          cr.image_url,
          cr.contact_phone,
          cr.contact_email,
          cr.reported_by,
          cr.created_at,
          u.urgency_level,
          rs.status_name AS db_status,
          vca.progress_status AS volunteer_status,
          l.address_description AS location
        FROM CASE_REPORT cr
        LEFT JOIN URGENCY u ON cr.urgency_id = u.urgency_id
        LEFT JOIN REPORT_STATUS rs ON cr.status_id = rs.status_id
        LEFT JOIN volunteer_case_assignment vca ON cr.report_id = vca.report_id
        LEFT JOIN REPORT_LOCATION rl ON cr.report_id = rl.report_id
        LEFT JOIN LOCATION l ON rl.location_id = l.location_id
        ORDER BY cr.report_id DESC`
      );

      const formattedRows = rows.map(r => {
        let displayStatus = r.db_status || 'Open';
        
        if (r.db_status === 'in_progress' || r.db_status === 'open') {
           if (r.volunteer_status === 'in-treatment') displayStatus = 'In Treatment';
           else if (r.volunteer_status === 'in-progress') displayStatus = 'In Progress';
           else if (r.volunteer_status === 'stable') displayStatus = 'Stable';
           else if (r.db_status === 'in_progress') displayStatus = 'In Progress';
        } else if (r.db_status === 'resolved') {
           displayStatus = 'Resolved';
        } else if (r.db_status === 'closed') {
           displayStatus = 'Closed';
        }

        return { ...r, status_name: displayStatus };
      });

      res.json(formattedRows);
    } catch (error) {
      console.error("Get cases error:", error);
      res.status(500).json({
        message: "Failed to load cases.",
        error: error.message,
      });
    }
  },

  getCaseById: async (req, res) => {
    try {
      const [rows] = await pool.query(
        `SELECT
          cr.report_id,
          cr.description,
          cr.animal_type,
          cr.animal_condition,
          cr.image_url,
          cr.contact_phone,
          cr.contact_email,
          cr.reported_by,
          cr.created_at,
          u.urgency_level,
          rs.status_name AS db_status,
          vca.progress_status AS volunteer_status,
          l.address_description AS location
        FROM CASE_REPORT cr
        LEFT JOIN URGENCY u ON cr.urgency_id = u.urgency_id
        LEFT JOIN REPORT_STATUS rs ON cr.status_id = rs.status_id
        LEFT JOIN volunteer_case_assignment vca ON cr.report_id = vca.report_id
        LEFT JOIN REPORT_LOCATION rl ON cr.report_id = rl.report_id
        LEFT JOIN LOCATION l ON rl.location_id = l.location_id
        WHERE cr.report_id = ?
        LIMIT 1`,
        [req.params.id]
      );

      if (rows.length === 0) {
        return res.status(404).json({ message: "Case not found." });
      }

      const r = rows[0];
      let displayStatus = r.db_status || 'Open';
      if (r.db_status === 'in_progress' || r.db_status === 'open') {
         if (r.volunteer_status === 'in-treatment') displayStatus = 'In Treatment';
         else if (r.volunteer_status === 'in-progress') displayStatus = 'In Progress';
         else if (r.volunteer_status === 'stable') displayStatus = 'Stable';
         else if (r.db_status === 'in_progress') displayStatus = 'In Progress';
      } else if (r.db_status === 'resolved') {
         displayStatus = 'Resolved';
      } else if (r.db_status === 'closed') {
         displayStatus = 'Closed';
      }

      res.json({ ...r, status_name: displayStatus });
    } catch (error) {
      console.error("Get case details error:", error);
      res.status(500).json({
        message: "Failed to load case details.",
        error: error.message,
      });
    }
  },

  updateCaseStatus: async (req, res) => {
    try {
      const { status, volunteer_id } = req.body;

      if (!status) {
        return res.status(400).json({ message: "Status is required." });
      }

      const statusId = await getStatusId(status);

      if (!statusId) {
        return res.status(400).json({
          message: "Invalid status. Use open, in_progress, resolved, or closed.",
        });
      }

      const [result] = await pool.query(
        `UPDATE CASE_REPORT
         SET status_id = ?
         WHERE report_id = ?`,
        [statusId, req.params.id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Case not found." });
      }

      if (volunteer_id) {
        // Also assign the volunteer
        const [existing] = await pool.query("SELECT * FROM volunteer_case_assignment WHERE report_id = ? AND volunteer_id = ?", [req.params.id, volunteer_id]);
        if (existing.length === 0) {
            await pool.query("INSERT INTO volunteer_case_assignment (report_id, volunteer_id, progress_status) VALUES (?, ?, 'in-progress')", [req.params.id, volunteer_id]);
            await notificationService.notifyAdmins('update', 'Volunteer Assigned', '5. Volunteer assigned to case');
            await notificationService.createNotification(volunteer_id, 'alert', 'New Case Assigned', '1. New case assigned by admin\n2. Case details received\n3. Veterinarian assignment required');
        }
      }

      // Notify the user who reported the case
      const [caseRows] = await pool.query("SELECT user_id, reported_by, animal_type FROM CASE_REPORT WHERE report_id = ?", [req.params.id]);
      if (caseRows.length > 0 && caseRows[0].user_id) {
          const reporterId = caseRows[0].user_id;
          const animalType = caseRows[0].animal_type || "animal";
          let message = `The rescue case for the ${animalType} you reported has been updated to ${status}.`;
          if (status === 'in_progress' && volunteer_id) {
              message = '3. Report accepted by admin\n4. Case created from the report\n5. Volunteer assigned to the case';
          }
          await notificationService.createNotification(
              reporterId,
              "update",
              "Case Status Updated",
              message
          );
      }

      res.json({
        message: "Case status updated successfully.",
        report_id: req.params.id,
        status,
        assigned_volunteer: volunteer_id || null
      });
    } catch (error) {
      console.error("Update case status error:", error);
      res.status(500).json({
        message: "Failed to update case status.",
        error: error.message,
      });
    }
  },
};

module.exports = caseController;