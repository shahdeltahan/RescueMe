const express = require("express");
const jwt = require("jsonwebtoken");
const pool = require("../db");
const { authenticateToken, authorizeRoles } = require("../middleware/authMiddleware");

const router = express.Router();

// GET /api/requests
// Get all requests (for admin)
router.get("/", authenticateToken, authorizeRoles("admin"), async (req, res) => {
    try {
        const [requests] = await pool.query(
            `SELECT 
                r.request_id,
                r.request_type,
                r.status,
                r.title,
                r.description,
                r.submitted_at,
                r.reviewed_at,
                u.user_id,
                u.full_name as submitted_by,
                reviewer.full_name as reviewed_by_name
             FROM \`REQUEST\` r
             JOIN \`USER\` u ON r.user_id = u.user_id
             LEFT JOIN \`USER\` reviewer ON r.reviewed_by = reviewer.user_id
             ORDER BY r.submitted_at DESC`
        );

        res.json(requests);
    } catch (error) {
        console.error("Get requests error:", error);
        res.status(500).json({ error: "Server error." });
    }
});

// POST /api/requests
// Submit a new request
router.post("/", async (req, res) => {
    try {
        let user_id = req.body.user_id;
        
        if (!user_id) {
            const authHeader = req.headers.authorization;
            if (authHeader && authHeader.startsWith("Bearer ")) {
                const token = authHeader.split(" ")[1];
                try {
                    const decoded = jwt.verify(token, process.env.JWT_SECRET || "rescueme_secret_key");
                    user_id = decoded.user_id;
                } catch (err) {
                    return res.status(403).json({ error: "Forbidden: Invalid or expired token" });
                }
            }
        }

        const { request_type, title, description } = req.body;

        if (!user_id || !title) {
            return res.status(400).json({ error: "user_id and title are required." });
        }

        const validTypes = ['role_change', 'account_unlock', 'other'];
        const type = validTypes.includes(request_type) ? request_type : 'other';

        await pool.query(
            `INSERT INTO \`REQUEST\` (user_id, request_type, title, description)
             VALUES (?, ?, ?, ?)`,
            [user_id, type, title, description]
        );

        res.status(201).json({ message: "Request submitted successfully." });
    } catch (error) {
        console.error("Submit request error:", error);
        res.status(500).json({ error: "Server error." });
    }
});

// PUT /api/requests/:id/status
// Update request status (approve/reject/cancel)
router.put("/:id/status", authenticateToken, authorizeRoles("admin"), async (req, res) => {
    try {
        const requestId = req.params.id;
        const { status } = req.body;
        const admin_id = req.user.user_id;

        if (!status) {
            return res.status(400).json({ error: "status is required." });
        }

        const validStatuses = ['pending', 'approved', 'rejected', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: "Invalid status." });
        }

        await pool.query(
            `UPDATE \`REQUEST\`
             SET status = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP
             WHERE request_id = ?`,
            [status, admin_id, requestId]
        );

        if (status === 'approved') {
            const [reqs] = await pool.query("SELECT user_id, request_type, title FROM `REQUEST` WHERE request_id = ?", [requestId]);
            if (reqs.length > 0) {
                const r = reqs[0];
                if (r.request_type === 'account_unlock') {
                    await pool.query("UPDATE `USER` SET status_id = 1, failed_login_attempts = 0 WHERE user_id = ?", [r.user_id]);
                } else if (r.request_type === 'role_change') {
                    const words = r.title.split(' ');
                    const requestedRole = words[words.length - 1].toLowerCase();
                    const [roles] = await pool.query("SELECT role_id FROM `ROLE` WHERE role_name = ?", [requestedRole]);
                    if (roles.length > 0) {
                        const newRoleId = roles[0].role_id;
                        const [users] = await pool.query("SELECT role_id FROM `USER` WHERE user_id = ?", [r.user_id]);
                        if (users.length > 0) {
                            const oldRoleId = users[0].role_id;
                            if (oldRoleId !== newRoleId) {
                                await pool.query("UPDATE `USER` SET role_id = ? WHERE user_id = ?", [newRoleId, r.user_id]);
                                await pool.query(
                                    "INSERT INTO ROLE_CHANGE_LOG (user_id, changed_by, old_role_id, new_role_id, reason) VALUES (?, ?, ?, ?, ?)",
                                    [r.user_id, admin_id, oldRoleId, newRoleId, "Approved role change request"]
                                );
                            }
                        }
                    }
                }
            }
        }

        res.json({ message: `Request ${status} successfully.` });
    } catch (error) {
        console.error("Update request status error:", error);
        res.status(500).json({ error: "Server error." });
    }
});

module.exports = router;
