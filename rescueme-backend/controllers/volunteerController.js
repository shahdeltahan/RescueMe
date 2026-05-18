const pool = require("../db");
const notificationService = require("../services/notificationService");

function getUserId(req) {
  return req.user?.user_id || req.user?.id || req.user?.userId;
}

const volunteerController = {
  getAssignedCases: async (req, res) => {
    try {
      const userId = getUserId(req);
      const [rows] = await pool.query(`
        SELECT 
          vca.assignment_id,
          vca.progress_status,
          vca.assigned_at,
          vca.completed_at,
          cr.report_id,
          cr.animal_type,
          cr.animal_condition,
          cr.image_url,
          rs.status_name,
          l.address_description AS location,
          u.full_name AS vet_name
        FROM volunteer_case_assignment vca
        JOIN CASE_REPORT cr ON vca.report_id = cr.report_id
        LEFT JOIN REPORT_STATUS rs ON cr.status_id = rs.status_id
        LEFT JOIN REPORT_LOCATION rl ON cr.report_id = rl.report_id
        LEFT JOIN LOCATION l ON rl.location_id = l.location_id
        LEFT JOIN USER u ON cr.vet_id = u.user_id
        WHERE vca.volunteer_id = ?
        ORDER BY vca.assigned_at DESC
      `, [userId]);

      res.json(rows);
    } catch (error) {
      console.error("Get assigned cases error:", error);
      res.status(500).json({ error: error.message });
    }
  },

  acceptCase: async (req, res) => {
    const connection = await pool.getConnection();
    try {
      const userId = getUserId(req);
      const { reportId } = req.params;

      await connection.beginTransaction();

      // Check if it's already assigned
      const [existing] = await connection.query(
        "SELECT * FROM volunteer_case_assignment WHERE report_id = ? AND completed_at IS NULL",
        [reportId]
      );

      if (existing.length > 0) {
        await connection.rollback();
        return res.status(400).json({ error: "Case is already assigned." });
      }

      await connection.query(
        "INSERT INTO volunteer_case_assignment (volunteer_id, report_id) VALUES (?, ?)",
        [userId, reportId]
      );

      // Update case status to 'in_progress'
      const [statusRows] = await connection.query("SELECT status_id FROM REPORT_STATUS WHERE status_name = 'in_progress' LIMIT 1");
      if (statusRows.length > 0) {
        await connection.query("UPDATE CASE_REPORT SET status_id = ? WHERE report_id = ?", [statusRows[0].status_id, reportId]);
      }

      await connection.commit();
      res.json({ message: "Case accepted successfully." });
    } catch (error) {
      await connection.rollback();
      console.error("Accept case error:", error);
      res.status(500).json({ error: error.message });
    } finally {
      connection.release();
    }
  },

  updateProgress: async (req, res) => {
    try {
      const userId = getUserId(req);
      const { assignmentId } = req.params;
      const { progressStatus } = req.body;

      const [result] = await pool.query(
        "UPDATE volunteer_case_assignment SET progress_status = ? WHERE assignment_id = ? AND volunteer_id = ?",
        [progressStatus, assignmentId, userId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Assignment not found or unauthorized." });
      }

      res.json({ message: "Progress updated successfully." });
    } catch (error) {
      console.error("Update progress error:", error);
      res.status(500).json({ error: error.message });
    }
  },

  closeCase: async (req, res) => {
    const connection = await pool.getConnection();
    try {
      const userId = getUserId(req);
      const { assignmentId } = req.params;

      await connection.beginTransaction();

      const [assignments] = await connection.query(
        "SELECT report_id FROM volunteer_case_assignment WHERE assignment_id = ? AND volunteer_id = ?",
        [assignmentId, userId]
      );

      if (assignments.length === 0) {
        await connection.rollback();
        return res.status(404).json({ error: "Assignment not found or unauthorized." });
      }

      const reportId = assignments[0].report_id;

      await connection.query(
        "UPDATE volunteer_case_assignment SET completed_at = NOW(), progress_status = 'stable' WHERE assignment_id = ?",
        [assignmentId]
      );

      const [statusRows] = await connection.query("SELECT status_id FROM REPORT_STATUS WHERE status_name = 'closed' LIMIT 1");
      if (statusRows.length > 0) {
        await connection.query("UPDATE CASE_REPORT SET status_id = ? WHERE report_id = ?", [statusRows[0].status_id, reportId]);
      }

      const [caseRows] = await connection.query("SELECT animal_type FROM CASE_REPORT WHERE report_id = ?", [reportId]);
      const [animalExists] = await connection.query("SELECT * FROM animal WHERE report_id = ?", [reportId]);
      if (animalExists.length === 0) {
          let speciesId = 1; // Default Dog
          const typeLower = caseRows.length > 0 && caseRows[0].animal_type ? caseRows[0].animal_type.toLowerCase() : '';
          if (typeLower.includes('cat')) speciesId = 2;
          else if (typeLower.includes('bird')) speciesId = 3;
          else if (typeLower.includes('rabbit')) speciesId = 4;
          else if (typeLower.includes('turtle')) speciesId = 5;

          await connection.query(
              "INSERT INTO animal (report_id, species_id, gender, health_status_id, adoption_status_id) VALUES (?, ?, 'Unknown', 6, 2)",
              [reportId, speciesId]
          );
      } else {
          await connection.query(
              "UPDATE animal SET health_status_id = 6, adoption_status_id = 2 WHERE report_id = ?",
              [reportId]
          );
      }

      await connection.commit();

      await notificationService.notifyAdmins('system', 'Case Closed', '13. Case closed after adoption');
      await notificationService.createNotification(userId, 'system', 'Case Closed', '14. Case closed successfully');
      const [caseRows2] = await connection.query("SELECT user_id FROM CASE_REPORT WHERE report_id = ?", [reportId]);
      if (caseRows2.length > 0 && caseRows2[0].user_id) {
          await notificationService.createNotification(caseRows2[0].user_id, 'system', 'Case Closed', '12. Case closed');
      }

      res.json({ message: "Case closed successfully." });
    } catch (error) {
      await connection.rollback();
      console.error("Close case error:", error);
      res.status(500).json({ error: error.message });
    } finally {
      connection.release();
    }
  },

  getTasks: async (req, res) => {
    try {
      const userId = getUserId(req);
      const [rows] = await pool.query("SELECT * FROM volunteer_task WHERE volunteer_id = ? ORDER BY is_done ASC, created_at DESC", [userId]);
      res.json(rows);
    } catch (error) {
      console.error("Get tasks error:", error);
      res.status(500).json({ error: error.message });
    }
  },

  addTask: async (req, res) => {
    try {
      const userId = getUserId(req);
      const { text, priority } = req.body;
      const [result] = await pool.query(
        "INSERT INTO volunteer_task (volunteer_id, task_text, priority) VALUES (?, ?, ?)",
        [userId, text, priority || 'Med']
      );
      res.json({ message: "Task added.", task_id: result.insertId });
    } catch (error) {
      console.error("Add task error:", error);
      res.status(500).json({ error: error.message });
    }
  },

  toggleTask: async (req, res) => {
    try {
      const userId = getUserId(req);
      const { taskId } = req.params;
      const { isDone } = req.body;
      
      const [result] = await pool.query(
        "UPDATE volunteer_task SET is_done = ? WHERE task_id = ? AND volunteer_id = ?",
        [isDone ? 1 : 0, taskId, userId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Task not found." });
      }

      res.json({ message: "Task updated." });
    } catch (error) {
      console.error("Toggle task error:", error);
      res.status(500).json({ error: error.message });
    }
  },

  getVets: async (req, res) => {
    try {
      const [rows] = await pool.query(`
        SELECT u.user_id, u.full_name, u.email 
        FROM USER u 
        JOIN ROLE r ON u.role_id = r.role_id 
        WHERE r.role_name = 'vet' AND u.status_id = (SELECT status_id FROM USER_STATUS WHERE status_name = 'active')
      `);
      res.json(rows);
    } catch (error) {
      console.error("Get vets error:", error);
      res.status(500).json({ error: error.message });
    }
  },

  assignVet: async (req, res) => {
    try {
      const { reportId } = req.params;
      const { vetId } = req.body;
      const [result] = await pool.query("UPDATE CASE_REPORT SET vet_id = ? WHERE report_id = ?", [vetId, reportId]);
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Case not found." });
      }

      await notificationService.notifyAdmins('system', 'Vet Assigned', '6. Volunteer assigned veterinarian to case');
      await notificationService.createNotification(vetId, 'alert', 'New Case Assigned', '1. New case assigned by volunteer\n2. Case details received\n3. Medical record required');
      
      const userId = getUserId(req);
      if (userId) {
          await notificationService.createNotification(userId, 'system', 'Vet Assigned', '4. Veterinarian assigned successfully');
      }

      const [caseRows] = await pool.query("SELECT user_id FROM CASE_REPORT WHERE report_id = ?", [reportId]);
      if (caseRows.length > 0 && caseRows[0].user_id) {
          await notificationService.createNotification(caseRows[0].user_id, 'update', 'Vet Assigned', '6. Veterinarian assigned to the case');
      }

      res.json({ message: "Veterinarian assigned successfully." });
    } catch (error) {
      console.error("Assign vet error:", error);
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = volunteerController;
