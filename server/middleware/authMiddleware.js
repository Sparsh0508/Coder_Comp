const User = require("../models/User");
const { verifyToken } = require("../utils/jwt");

module.exports = async function authMiddleware(req, res, next) {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    const payload = verifyToken(token);
    const user = await User.findById(payload.userId);

    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid session" });
    }

    if ((payload.sessionVersion || 0) !== (user.sessionVersion || 0)) {
      return res.status(401).json({ success: false, message: "Session expired. Please log in again." });
    }

    req.user = user;
    return next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};
