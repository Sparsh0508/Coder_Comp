const jwt = require("jsonwebtoken");

function signToken(payload, options = {}) {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }

  return jwt.sign(payload, secret, {
    expiresIn: options.expiresIn || process.env.JWT_EXPIRES_IN || "7d",
  });
}

function buildTokenPayload(user) {
  return {
    userId: user._id.toString(),
    sessionVersion: user.sessionVersion || 0,
  };
}

function verifyToken(token) {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }

  return jwt.verify(token, secret);
}

module.exports = {
  buildTokenPayload,
  signToken,
  verifyToken,
};
