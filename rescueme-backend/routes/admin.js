const express = require("express");
const pool = require("../db");
const notificationService = require("../services/notificationService");
const { authenticateToken, authorizeRoles } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/users", authenticateToken, authorizeRoles("admin"), async (req, res) => {
    try {
        const [users] = await pool.query(
            `SELECT 
                u.user_id,
                u.full_name,
                u.email,
                u.phone_number,
                r.role_name,
                s.status_name,
                u.failed_login_attempts,
                u.created_at
             FROM \`USER\` u
             JOIN \`ROLE\` r ON u.role_id = r.role_id
             JOIN \`USER_STATUS\` s ON u.status_id = s.status_id
             ORDER BY u.user_id`
        );

        await pool.query(
            `INSERT INTO ADMIN_ACTION_LOG 
            (admin_id, target_user_id, action_type, notes)
            VALUES (?, ?, ?, ?)`,
            [
                req.user.user_id,
                null,
                "view_users",
                "Admin viewed users list"
            ]
        );

        res.json(users);

    } catch (error) {
        console.error("Get users error:", error);
        res.status(500).json({ error: "Server error." });
    }
});

router.put("/users/:id/role", authenticateToken, authorizeRoles("admin"), async (req, res) => {
    try {
        const userId = req.params.id;
        const { new_role } = req.body;
        const admin_id = req.user.user_id;

        const allowedRoles = ["adopter", "admin", "vet", "volunteer", "reporter"];

        if (!new_role || !allowedRoles.includes(new_role)) {
            return res.status(400).json({ error: "Invalid role." });
        }

        const [userRows] = await pool.query(
            "SELECT user_id, role_id FROM `USER` WHERE user_id = ?",
            [userId]
        );

        if (userRows.length === 0) {
            return res.status(404).json({ error: "User not found." });
        }

        const oldRoleId = userRows[0].role_id;

        const [roleRows] = await pool.query(
            "SELECT role_id FROM `ROLE` WHERE role_name = ?",
            [new_role]
        );

        if (roleRows.length === 0) {
            return res.status(400).json({ error: "Role does not exist." });
        }

        const newRoleId = roleRows[0].role_id;

        await pool.query(
            "UPDATE `USER` SET role_id = ? WHERE user_id = ?",
            [newRoleId, userId]
        );

        await pool.query(
            "INSERT INTO ROLE_CHANGE_LOG (user_id, changed_by, old_role_id, new_role_id, reason) VALUES (?, ?, ?, ?, ?)",
            [userId, admin_id, oldRoleId, newRoleId, "Admin dashboard role change"]
        );

        await notificationService.notifyAdmins('system', 'User Role Changed', `Admin changed role of user ${userId} to ${new_role}`);

        res.json({ message: "User role updated successfully." });
    } catch (error) {
        console.error("Change role error:", error);
        res.status(500).json({ error: "Server error." });
    }
});
router.put("/users/:id/status", authenticateToken, authorizeRoles("admin"), async (req, res) => {
    try {
        const userId = req.params.id;
        let { new_status } = req.body;
        const admin_id = req.user.user_id;

        if (!new_status) {
            return res.status(400).json({ error: "new_status is required." });
        }

        new_status = new_status.trim().toLowerCase();

        const allowedStatuses = ["active", "locked", "disabled"];

        if (!allowedStatuses.includes(new_status)) {
            return res.status(400).json({ error: "Invalid status." });
        }

        const [userRows] = await pool.query(
            "SELECT user_id, status_id FROM `USER` WHERE user_id = ?",
            [userId]
        );

        if (userRows.length === 0) {
            return res.status(404).json({ error: "User not found." });
        }

        const oldStatusId = userRows[0].status_id;

        const [statusRows] = await pool.query(
            "SELECT status_id FROM `USER_STATUS` WHERE status_name = ?",
            [new_status]
        );

        if (statusRows.length === 0) {
            return res.status(400).json({ error: "Status does not exist." });
        }

        const newStatusId = statusRows[0].status_id;

        await pool.query(
            `UPDATE \`USER\`
             SET status_id = ?, failed_login_attempts = 0
             WHERE user_id = ?`,
            [newStatusId, userId]
        );

        await notificationService.notifyAdmins('system', 'User Status Changed', `Admin changed status of user ${userId} to ${new_status}`);

        res.json({ message: "User status updated successfully." });
    } catch (error) {
        console.error("Change status error:", error);
        res.status(500).json({ error: "Server error." });
    }
});

const bcrypt = require("bcryptjs");

router.post("/users", authenticateToken, authorizeRoles("admin"), async (req, res) => {
    try {
        let { full_name, email, password, role, phone_number } = req.body;

        if (!full_name || !email || !password || !role) {
            return res.status(400).json({ error: "All required fields must be provided." });
        }

        full_name = full_name.trim();
        email = email.trim().toLowerCase();
        phone_number = phone_number ? phone_number.trim() : "";
        role = role.trim().toLowerCase();

        const allowedRoles = ["adopter", "admin", "vet", "volunteer", "reporter"];
        if (!allowedRoles.includes(role)) {
            return res.status(400).json({ error: "Invalid role." });
        }

        const [existingUsers] = await pool.query(
            "SELECT user_id FROM `USER` WHERE email = ?",
            [email]
        );

        if (existingUsers.length > 0) {
            return res.status(409).json({ error: "Email already exists." });
        }

        const [roles] = await pool.query(
            "SELECT role_id FROM `ROLE` WHERE role_name = ?",
            [role]
        );

        if (roles.length === 0) {
            return res.status(400).json({ error: "Role does not exist in database." });
        }

        const roleId = roles[0].role_id;
        const hashedPassword = await bcrypt.hash(password, 10);

        const [result] = await pool.query(
            `INSERT INTO \`USER\`
             (full_name, email, password, phone_number, role_id, status_id)
             VALUES (?, ?, ?, ?, ?, 1)`,
            [full_name, email, hashedPassword, phone_number, roleId]
        );

        return res.status(201).json({
            message: "User created successfully.",
            user: {
                user_id: result.insertId,
                full_name,
                email,
                role
            }
        });
    } catch (error) {
        console.error("Create user error:", error);
        return res.status(500).json({ error: "Server error." });
    }
});
router.get("/action-logs", authenticateToken, authorizeRoles("admin"), async (req, res) => {
    try {
        const [logs] = await pool.query(`
            SELECT 
                l.log_id,
                l.admin_id,
                admin.full_name AS admin_name,
                l.target_user_id,
                target.full_name AS target_user_name,
                target.email AS target_user_email,
                l.action_type,
                oldRole.role_name AS old_role,
                newRole.role_name AS new_role,
                l.notes,
                l.created_at
            FROM ADMIN_ACTION_LOG l
            JOIN \`USER\` admin ON l.admin_id = admin.user_id
            JOIN \`USER\` target ON l.target_user_id = target.user_id
            LEFT JOIN ROLE oldRole ON l.old_role_id = oldRole.role_id
            LEFT JOIN ROLE newRole ON l.new_role_id = newRole.role_id
            ORDER BY l.created_at DESC
            LIMIT 50
        `);

        res.json(logs);
    } catch (error) {
        console.error("Get admin action logs error:", error);
        res.status(500).json({ error: "Failed to load admin action logs" });
    }
});

module.exports = router;