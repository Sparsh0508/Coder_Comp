const jwt = require("jsonwebtoken");
const db = require("../config/db");

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized " })
    }
    const token = authHeader.split(" ")[1];
    const decode = jwt.verify(token, process.env.JWT_SECRET)
    const [rows] = await db.query(
      "SELECT id, username, role, is_banned FROM users WHERE id = ?",
      [decode.id]
    );
    const user = rows[0];

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    if (user.is_banned) {
      return res.status(403).json({ message: "User is banned" });
    }

    req.user = user;

    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }

}
module.exports = authMiddleware;