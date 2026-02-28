const jwt = require("jsonwebtoken");

const isAdmin = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "No token provided or invalid format (use Bearer <token>)" });
    }

    const token = authHeader.split(" ")[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log("Decoded Token Role:", decoded.role); // Debugging

        if (decoded.role !== "admin") {
            return res.status(403).json({ message: `Access denied. Your role is ${decoded.role}, but Admin is required.` });
        }
        req.user = decoded;
        next();
    } catch (error) {
        console.error("JWT Verification Error:", error.message);
        return res.status(401).json({ message: "Invalid or expired token" });
    }
};

module.exports = isAdmin;
