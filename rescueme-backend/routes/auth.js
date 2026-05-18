const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../db");

const router = express.Router();

router.post("/signup", async (req, res) => {
    try {
        let { full_name, email, password, role, phone_number } = req.body;

        if (!full_name || !email || !password || !role || !phone_number) {
            return res.status(400).json({ error: "All fields are required." });
        }

        full_name = full_name.trim();
        email = email.trim().toLowerCase();
        phone_number = phone_number.trim();
        role = role.trim().toLowerCase();

        console.log("BODY:", req.body);
        console.log("ROLE RECEIVED:", role);

        const allowedRoles = ["adopter", "admin", "vet", "volunteer", "reporter"];

        console.log("ROLE RAW:", req.body.role);
        console.log("ROLE CLEAN:", role);
        console.log("ALLOWED:", allowedRoles);

        if (!allowedRoles.includes(role)) {
            return res.status(400).json({
                error: "Invalid role.",
                received: role,
                allowed: allowedRoles
            });
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
            message: "User registered successfully.",
            user: {
                user_id: result.insertId,
                full_name,
                email,
                phone_number,
                role,
            },
        });
    } catch (error) {
        console.error("Signup error:", error);
        return res.status(500).json({
            error: "Server error. Please try again.",
            details: error.message,
        });
    }
});

router.post("/login", async (req, res) => {
    try {
        let { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required." });
        }

        email = email.trim().toLowerCase();

        const [users] = await pool.query(
            `SELECT 
                u.user_id,
                u.full_name,
                u.email,
                u.password,
                u.phone_number,
                r.role_name,
                s.status_name
             FROM \`USER\` u
             JOIN \`ROLE\` r ON u.role_id = r.role_id
             JOIN \`USER_STATUS\` s ON u.status_id = s.status_id
             WHERE u.email = ?`,
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({ error: "Invalid email or password." });
        }

        const user = users[0];

        if (user.status_name !== "active") {
            return res.status(403).json({ error: "Account is not active.", user_id: user.user_id });
        }
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            await pool.query(
                `UPDATE \`USER\`
         SET failed_login_attempts = failed_login_attempts + 1
         WHERE user_id = ?`,
                [user.user_id]
            );

            const [updated] = await pool.query(
                "SELECT failed_login_attempts FROM `USER` WHERE user_id = ?",
                [user.user_id]
            );

            const attempts = updated[0].failed_login_attempts;

            if (attempts >= 5) {
                await pool.query(
                    `UPDATE \`USER\`
             SET status_id = 2
             WHERE user_id = ?`,
                    [user.user_id]
                );

                return res.status(403).json({
                    error: "Account locked due to too many failed attempts.",
                    user_id: user.user_id
                });
            }

            return res.status(401).json({
                error: `Invalid email or password. Attempts: ${attempts}/5`
            });
        }

        const token = jwt.sign(
            {
                user_id: user.user_id,
                email: user.email,
                role: user.role_name,
            },
            process.env.JWT_SECRET || "rescueme_secret_key",
            { expiresIn: "1d" }
        );

        return res.json({
            message: "Login successful.",
            token,
            user: {
                user_id: user.user_id,
                full_name: user.full_name,
                email: user.email,
                phone_number: user.phone_number,
                role: user.role_name,
            },
           
        });


    }
     catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({
            error: "Server error. Please try again.",
            details: error.message,
        });
    }
});

router.delete("/delete", async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const token = authHeader.split(" ")[1];
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET || "rescueme_secret_key");
        } catch (err) {
            return res.status(401).json({ error: "Invalid token" });
        }

        const userId = decoded.user_id;

        // Attempt to delete the user. If there are foreign key constraints, this might fail unless ON DELETE CASCADE is set.
        const [result] = await pool.query(
            "DELETE FROM `USER` WHERE user_id = ?",
            [userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        return res.json({ message: "Account deleted successfully." });
    } catch (error) {
        console.error("Delete account error:", error);
        return res.status(500).json({
            error: "Server error. Please try again.",
            details: error.message,
        });
    }
});

router.get("/profile", async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const token = authHeader.split(" ")[1];
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET || "rescueme_secret_key");
        } catch (err) {
            return res.status(401).json({ error: "Invalid token" });
        }

        const userId = decoded.user_id;

        const [users] = await pool.query(
            "SELECT full_name, email, phone_number FROM `USER` WHERE user_id = ?",
            [userId]
        );
        if (users.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        const [profiles] = await pool.query(
            "SELECT profile_picture, address, bio FROM profile WHERE user_id = ?",
            [userId]
        );

        const user = users[0];
        const profile = profiles.length > 0 ? profiles[0] : { profile_picture: '', address: '', bio: '' };

        return res.json({
            full_name: user.full_name,
            email: user.email,
            phone_number: user.phone_number,
            profile_picture: profile.profile_picture || '',
            address: profile.address || '',
            bio: profile.bio || ''
        });
    } catch (error) {
        console.error("Get profile error:", error);
        return res.status(500).json({ error: "Server error" });
    }
});

router.put("/profile", async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const token = authHeader.split(" ")[1];
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET || "rescueme_secret_key");
        } catch (err) {
            return res.status(401).json({ error: "Invalid token" });
        }

        const userId = decoded.user_id;
        const { full_name, email, phone_number, address, bio, profile_picture } = req.body;

        await pool.query(
            "UPDATE `USER` SET full_name = ?, email = ?, phone_number = ? WHERE user_id = ?",
            [full_name, email, phone_number, userId]
        );

        const [profiles] = await pool.query("SELECT profile_id FROM profile WHERE user_id = ?", [userId]);
        if (profiles.length > 0) {
            await pool.query(
                "UPDATE profile SET profile_picture = ?, address = ?, bio = ? WHERE user_id = ?",
                [profile_picture, address, bio, userId]
            );
        } else {
            await pool.query(
                "INSERT INTO profile (user_id, profile_picture, address, bio) VALUES (?, ?, ?, ?)",
                [userId, profile_picture, address, bio]
            );
        }

        return res.json({ message: "Profile updated successfully" });
    } catch (error) {
        console.error("Update profile error:", error);
        return res.status(500).json({ error: "Server error" });
    }
});

module.exports = router;