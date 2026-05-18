const pool = require("../db");

function getUserId(req) {
  return req.user?.user_id || req.user?.id || req.user?.userId;
}

const notificationController = {
  getNotifications: async (req, res) => {
    try {
      const userId = getUserId(req);
      const [rows] = await pool.query(
        "SELECT notification_id AS id, type, title, message AS `desc`, sent_at AS time, NOT is_read AS unread FROM notification WHERE user_id = ? ORDER BY sent_at DESC",
        [userId]
      );
      res.json(rows);
    } catch (error) {
      console.error("Get notifications error:", error);
      res.status(500).json({ error: error.message });
    }
  },

  markAllRead: async (req, res) => {
    try {
      const userId = getUserId(req);
      await pool.query("UPDATE notification SET is_read = TRUE WHERE user_id = ?", [userId]);
      res.json({ message: "All notifications marked as read." });
    } catch (error) {
      console.error("Mark read error:", error);
      res.status(500).json({ error: error.message });
    }
  },

  dismissNotification: async (req, res) => {
    try {
      const userId = getUserId(req);
      const { id } = req.params;
      const [result] = await pool.query("DELETE FROM notification WHERE notification_id = ? AND user_id = ?", [id, userId]);
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Notification not found or unauthorized." });
      }

      res.json({ message: "Notification dismissed." });
    } catch (error) {
      console.error("Dismiss notification error:", error);
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = notificationController;
