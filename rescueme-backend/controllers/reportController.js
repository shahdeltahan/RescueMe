const pool = require("../db");
const notificationService = require("../services/notificationService");

function getUserId(req) {
  return req.user?.user_id || req.user?.id || req.user?.userId;
}

async function getUrgencyId(urgency) {
  const [rows] = await pool.query(
    "SELECT urgency_id FROM URGENCY WHERE LOWER(urgency_level) = LOWER(?) LIMIT 1",
    [urgency]
  );

  if (rows.length > 0) return rows[0].urgency_id;

  return 1;
}

async function getStatusId(statusName) {
  const [rows] = await pool.query(
    "SELECT status_id FROM REPORT_STATUS WHERE LOWER(status_name) = LOWER(?) LIMIT 1",
    [statusName]
  );

  if (rows.length > 0) return rows[0].status_id;

  return 1;
}

const reportController = {
  createReport: async (req, res) => {
    const connection = await pool.getConnection();

    try {
      const {
        animalType,
        condition,
        urgency,
        location,
        description,
        image,
        contactPhone,
        contactEmail,
        reportedBy,
      } = req.body;

      if (!animalType || !condition || !urgency || !location || !description) {
        return res.status(400).json({
          message: "animalType, condition, urgency, location, and description are required.",
        });
      }

      const userId = getUserId(req);
      const urgencyId = await getUrgencyId(urgency);
      const statusId = await getStatusId("open");

      await connection.beginTransaction();

      const [reportResult] = await connection.query(
        `INSERT INTO CASE_REPORT
        (description, urgency_id, status_id, user_id, animal_type, animal_condition, image_url, contact_phone, contact_email, reported_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          description,
          urgencyId,
          statusId,
          userId || null,
          animalType,
          condition,
          image || null,
          contactPhone || null,
          contactEmail || null,
          reportedBy || null,
        ]
      );

      const reportId = reportResult.insertId;

      const [locationResult] = await connection.query(
        `INSERT INTO LOCATION
        (address_description)
        VALUES (?)`,
        [location]
      );

      const locationId = locationResult.insertId;

      await connection.query(
        `INSERT INTO REPORT_LOCATION
        (location_id, report_id)
        VALUES (?, ?)`,
        [locationId, reportId]
      );

      await connection.commit();

      if (userId) {
        await notificationService.createNotification(userId, 'system', 'Report Submitted', '1. Report submitted successfully\n2. Report is waiting for admin review');
      }
      await notificationService.notifyAdmins('alert', 'New Animal Report', '1. New animal report submitted\n2. Report waiting for admin decision');

      res.status(201).json({
        message: "Report submitted successfully.",
        report_id: reportId,
      });
    } catch (error) {
      await connection.rollback();
      console.error("Create report error:", error);
      res.status(500).json({
        message: "Failed to create report.",
        error: error.message,
      });
    } finally {
      connection.release();
    }
  },

  getReports: async (req, res) => {
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
          rs.status_name,
          l.address_description AS location
        FROM CASE_REPORT cr
        LEFT JOIN URGENCY u ON cr.urgency_id = u.urgency_id
        LEFT JOIN REPORT_STATUS rs ON cr.status_id = rs.status_id
        LEFT JOIN REPORT_LOCATION rl ON cr.report_id = rl.report_id
        LEFT JOIN LOCATION l ON rl.location_id = l.location_id
        ORDER BY cr.report_id DESC`
      );

      res.json(rows);
    } catch (error) {
      console.error("Get reports error:", error);
      res.status(500).json({
        message: "Failed to load reports.",
        error: error.message,
      });
    }
  },
};

module.exports = reportController;