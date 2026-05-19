const pool = require("../db");
const notificationService = require("../services/notificationService");

function getUserId(req) {
  return req.user?.user_id || req.user?.id || req.user?.userId;
}

const veterinaryController = {
  getPatients: async (req, res) => {
    try {
      const userId = getUserId(req);
      // Patients are basically all cases that are assigned to this vet
      const [rows] = await pool.query(`
        SELECT 
          cr.report_id AS id,
          cr.animal_type AS name,
          cr.animal_condition AS breed,
          l.address_description AS location,
          cr.image_url AS image,
          rs.status_name AS status,
          u.full_name AS owner_name
        FROM CASE_REPORT cr
        LEFT JOIN REPORT_STATUS rs ON cr.status_id = rs.status_id
        LEFT JOIN REPORT_LOCATION rl ON cr.report_id = rl.report_id
        LEFT JOIN LOCATION l ON rl.location_id = l.location_id
        LEFT JOIN USER u ON cr.reported_by = u.user_id
        WHERE rs.status_name IN ('in_progress', 'resolved') AND cr.vet_id = ?
        ORDER BY cr.report_id DESC
      `, [userId]);

      const patients = rows.map(r => ({
        id: r.id,
        name: r.name || 'Unknown Animal',
        breed: r.location || 'Unknown',
        status: r.status === 'in_progress' ? 'Critical' : (r.status === 'resolved' ? 'Stable' : 'In Treatment'),
        owner: r.owner_name || 'Rescued',
        image: r.image || 'https://placehold.co/600x400/333333/888888?text=No+Photo',
      }));

      res.json(patients);
    } catch (error) {
      console.error("Get patients error:", error);
      res.status(500).json({ error: error.message });
    }
  },

  updatePatientStatus: async (req, res) => {
    const connection = await pool.getConnection();
    try {
      const { id } = req.params;
      const { status, age, gender } = req.body; 

      // Map Vet status to DB status
      let dbStatus = 'in_progress';
      if (status === 'Stable' || status === 'Resolved') {
        dbStatus = 'resolved';
      }

      await connection.beginTransaction();

      const [statusRows] = await connection.query("SELECT status_id FROM REPORT_STATUS WHERE status_name = ? LIMIT 1", [dbStatus]);
      if (statusRows.length > 0) {
        await connection.query("UPDATE CASE_REPORT SET status_id = ? WHERE report_id = ?", [statusRows[0].status_id, id]);
        
        const vetId = getUserId(req);
        const [caseRows] = await connection.query("SELECT user_id, animal_type FROM CASE_REPORT WHERE report_id = ?", [id]);
        const reporterId = caseRows.length > 0 ? caseRows[0].user_id : null;
        
        const [volAssignments] = await connection.query("SELECT volunteer_id FROM volunteer_case_assignment WHERE report_id = ?", [id]);
        const volunteerId = volAssignments.length > 0 ? volAssignments[0].volunteer_id : null;

        if (status === 'Stable') {
            await notificationService.notifyAdmins('system', 'Case Stable', '9. Case status changed to stable\n10. Case moved to adoption page');
            if (vetId) await notificationService.createNotification(vetId, 'system', 'Case Stable', '10. Case status changed to stable\n11. Case ready for adoption');
            if (volunteerId) await notificationService.createNotification(volunteerId, 'update', 'Case Stable', '7. Case medical status updated\n8. Case status changed to stable\n9. Case moved to adoption page');
            if (reporterId) await notificationService.createNotification(reporterId, 'update', 'Case Stable', '9. Case status changed to stable\n10. Case moved to adoption page');
        } else {
            await notificationService.notifyAdmins('update', 'Case Updated', '7. Veterinarian updated case details');
            if (vetId) await notificationService.createNotification(vetId, 'update', 'Case Updated', '5. Case medical details updated');
            if (volunteerId) await notificationService.createNotification(volunteerId, 'update', 'Case Updated', '5. Veterinarian updated case details');
            if (reporterId) await notificationService.createNotification(reporterId, 'update', 'Case Updated', '7. Case details updated by veterinarian');
        }

        if (status === 'Stable' && caseRows.length > 0) {
            // Update volunteer assignment progress, but keep it active until adopted
            await connection.query("UPDATE volunteer_case_assignment SET progress_status = 'stable' WHERE report_id = ?", [id]);

            // Add to ANIMAL table for adoption if not already there
            const [animalExists] = await connection.query("SELECT * FROM ANIMAL WHERE report_id = ?", [id]);
            if (animalExists.length === 0) {
                let speciesId = 1; // Default Dog
                const typeLower = caseRows[0].animal_type ? caseRows[0].animal_type.toLowerCase() : '';
                if (typeLower.includes('cat')) speciesId = 2;
                else if (typeLower.includes('bird')) speciesId = 3;
                else if (typeLower.includes('rabbit')) speciesId = 4;
                else if (typeLower.includes('turtle')) speciesId = 5;

                const insertAge = age !== undefined && age !== null ? age : null;
                const insertGender = gender || 'Unknown';

                await connection.query(
                    "INSERT INTO ANIMAL (report_id, species_id, estimated_age, gender, health_status_id, adoption_status_id) VALUES (?, ?, ?, ?, 6, 2)",
                    [id, speciesId, insertAge, insertGender]
                );
            } else {
                let updateQ = "UPDATE ANIMAL SET health_status_id = 6, adoption_status_id = 2";
                const queryParams = [];
                if (age !== undefined && age !== null) {
                    updateQ += ", estimated_age = ?";
                    queryParams.push(age);
                }
                if (gender) {
                    updateQ += ", gender = ?";
                    queryParams.push(gender);
                }
                updateQ += " WHERE report_id = ?";
                queryParams.push(id);

                await connection.query(updateQ, queryParams);
            }
        }

        await connection.commit();
        res.json({ message: "Patient status updated." });
      } else {
        await connection.rollback();
        res.status(400).json({ error: "Invalid status" });
      }
    } catch (error) {
      await connection.rollback();
      console.error("Update patient status error:", error);
      res.status(500).json({ error: error.message });
    } finally {
      connection.release();
    }
  },

  getAppointments: async (req, res) => {
    try {
      const userId = getUserId(req);
      const [rows] = await pool.query(`
        SELECT 
          a.appointment_id AS id,
          a.report_id,
          a.purpose AS reason,
          a.scheduled_date AS date,
          cr.animal_type AS patient
        FROM FOLLOWUP_APPOINTMENT a
        JOIN CASE_REPORT cr ON a.report_id = cr.report_id
        WHERE a.status = 'scheduled' AND a.created_by = ?
        ORDER BY a.scheduled_date ASC
      `, [userId]);
      res.json(rows);
    } catch (error) {
      console.error("Get appointments error:", error);
      res.status(500).json({ error: error.message });
    }
  },

  addAppointment: async (req, res) => {
    try {
      const userId = getUserId(req);
      const { report_id, reason, date } = req.body;

      const [result] = await pool.query(
        "INSERT INTO FOLLOWUP_APPOINTMENT (report_id, purpose, scheduled_date, created_by) VALUES (?, ?, ?, ?)",
        [report_id, reason, new Date(date), userId]
      );

      await notificationService.notifyAdmins('alert', 'Appointment Added', '8. Veterinarian added appointment');
      if (userId) await notificationService.createNotification(userId, 'system', 'Appointment Added', '7. Appointment added');
      
      const [volAssignments] = await pool.query("SELECT volunteer_id FROM volunteer_case_assignment WHERE report_id = ?", [report_id]);
      if (volAssignments.length > 0) {
          await notificationService.createNotification(volAssignments[0].volunteer_id, 'alert', 'Appointment Added', '6. Veterinarian added appointment');
      }

      const [caseRows] = await pool.query("SELECT user_id FROM CASE_REPORT WHERE report_id = ?", [report_id]);
      if (caseRows.length > 0 && caseRows[0].user_id) {
          await notificationService.createNotification(caseRows[0].user_id, 'alert', 'Appointment Added', '8. Case medical appointment added');
      }

      res.json({ message: "Appointment created", appointment_id: result.insertId });
    } catch (error) {
      console.error("Add appointment error:", error);
      res.status(500).json({ error: error.message });
    }
  },

  deleteAppointment: async (req, res) => {
    try {
      const { id } = req.params;
      await pool.query("UPDATE FOLLOWUP_APPOINTMENT SET status = 'cancelled' WHERE appointment_id = ?", [id]);
      res.json({ message: "Appointment cancelled" });
    } catch (error) {
      console.error("Delete appointment error:", error);
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = veterinaryController;
