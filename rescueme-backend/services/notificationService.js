const pool = require("../db");

const notificationService = {
  /**
   * Create a new notification for a specific user.
   * @param {number} userId - The ID of the user receiving the notification.
   * @param {string} type - 'system', 'adoption', 'report', etc.
   * @param {string} title - The title of the notification.
   * @param {string} message - The main body/description of the notification.
   */
  createNotification: async (userId, type, title, message) => {
    try {
      if(!userId) return;
      await pool.query(
        "INSERT INTO notification (user_id, type, title, message, sent_at, is_read) VALUES (?, ?, ?, ?, NOW(), 0)",
        [userId, type, title, message]
      );
    } catch (error) {
      console.error("Failed to create notification:", error);
    }
  },
  notifyAdmins: async (type, title, message) => {
    try {
      const [admins] = await pool.query("SELECT u.user_id FROM USER u JOIN ROLE r ON u.role_id = r.role_id WHERE r.role_name = 'admin'");
      for (const admin of admins) {
        await pool.query(
          "INSERT INTO notification (user_id, type, title, message, sent_at, is_read) VALUES (?, ?, ?, ?, NOW(), 0)",
          [admin.user_id, type, title, message]
        );
      }
    } catch (error) {
      console.error("Failed to notify admins:", error);
    }
  }
};

module.exports = notificationService;
