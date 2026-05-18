const jwt = require("jsonwebtoken");

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized: No token provided" });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET || "rescueme_secret_key"
        );

        req.user = decoded; // Contains user_id, email, role
        next();

    } catch (err) {
        return res.status(403).json({ error: "Forbidden: Invalid or expired token" });
    }
};

const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            return res.status(403).json({ error: "Forbidden: Role not found" });
        }

        if (!allowedRoles.map(role => role.toLowerCase()).includes(req.user.role.toLowerCase())) {
            return res.status(403).json({ error: "Forbidden: Insufficient permissions" });
        }

        next();
    };
};

module.exports = {
    authenticateToken,
    authorizeRoles,
};