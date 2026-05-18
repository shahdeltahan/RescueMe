const bcrypt = require("bcryptjs");
const pool = require("./db");

async function createAdmin() {
    const args = process.argv.slice(2);
    
    if (args.length < 4) {
        console.error("Usage: node create-admin.js <FullName> <Email> <Password> <PhoneNumber>");
        process.exit(1);
    }

    const [full_name, email, password, phone_number] = args;

    try {
        console.log(`Checking if email ${email} is already in use...`);
        const [existingUsers] = await pool.query(
            "SELECT user_id FROM `USER` WHERE email = ?",
            [email]
        );

        if (existingUsers.length > 0) {
            console.error("Error: Email already exists in the database.");
            process.exit(1);
        }

        console.log("Fetching admin role id...");
        const [roles] = await pool.query(
            "SELECT role_id FROM `ROLE` WHERE role_name = 'admin'"
        );

        if (roles.length === 0) {
            console.error("Error: 'admin' role does not exist in the database.");
            process.exit(1);
        }

        const adminRoleId = roles[0].role_id;

        console.log("Hashing password...");
        const hashedPassword = await bcrypt.hash(password, 10);

        console.log("Creating admin user...");
        const [result] = await pool.query(
            `INSERT INTO \`USER\`
             (full_name, email, password, phone_number, role_id, status_id)
             VALUES (?, ?, ?, ?, ?, 1)`,
            [full_name, email, hashedPassword, phone_number, adminRoleId]
        );

        console.log(`Success! Admin account created for ${email}. User ID: ${result.insertId}`);
    } catch (error) {
        console.error("An error occurred while creating the admin account:", error.message);
    } finally {
        // Close the database connection
        pool.end();
    }
}

createAdmin();
