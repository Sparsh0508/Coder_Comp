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
    const bearer = socket.handshake.headers.authorization;
    const bearerToken = bearer?.startsWith("Bearer ") ? bearer.slice(7) : null;
    const authToken = socket.handshake.auth?.token;
    const queryToken = socket.handshake.query?.token;
    const token = authToken || queryToken || bearerToken || cookies.token;

    if (!token) {
      return next(new Error("Socket authentication failed"));
    }

    const payload = verifyToken(token);
    const user = await User.findById(payload.userId).select("username email rating");

    if (!user) {
      return next(new Error("Socket authentication failed"));
    }

    if ((payload.sessionVersion || 0) !== (user.sessionVersion || 0)) {
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
