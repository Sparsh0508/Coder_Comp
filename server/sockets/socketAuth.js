const User = require("../models/User");
const { verifyToken } = require("../utils/jwt");

function parseCookies(cookieHeader = "") {
  return cookieHeader
    .split(";")
    .map((pair) => pair.trim())
    .filter(Boolean)
    .reduce((cookies, pair) => {
      const [key, ...rest] = pair.split("=");
      cookies[key] = decodeURIComponent(rest.join("="));
      return cookies;
    }, {});
}

async function authenticateSocket(socket, next) {
  try {
    const cookies = parseCookies(socket.handshake.headers.cookie || "");
    const token = cookies.token;

    if (!token) {
      return next(new Error("Socket authentication failed"));
    }

    const payload = verifyToken(token);
    const user = await User.findById(payload.userId).select("username email rating");

    if (!user) {
      return next(new Error("Socket authentication failed"));
    }

    socket.user = {
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      rating: user.rating,
    };

    return next();
  } catch (error) {
    return next(new Error("Socket authentication failed"));
  }
}

module.exports = {
  authenticateSocket,
};
