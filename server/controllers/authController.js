const bcrypt = require("bcrypt");

const User = require("../models/User");
const { signToken } = require("../utils/jwt");
const { setAuthCookie, clearAuthCookie } = require("../utils/cookies");

function sanitizeUser(user) {
  return {
    id: user._id,
    username: user.username,
    email: user.email,
    rating: user.rating,
    wins: user.wins,
    losses: user.losses,
    totalMatches: user.totalMatches,
  };
}

async function register(req, res, next) {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: "Username, email and password are required" });
    }

    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username }],
    });

    if (existingUser) {
      return res.status(409).json({ success: false, message: "User already exists with that email or username" });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await User.create({
      username,
      email: email.toLowerCase(),
      passwordHash,
    });

    const token = signToken({ userId: user._id.toString() });
    setAuthCookie(res, token);

    return res.status(201).json({
      success: true,
      message: "Account created successfully",
      user: sanitizeUser(user),
    });
  } catch (error) {
    return next(error);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);

    if (!isValidPassword) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const token = signToken({ userId: user._id.toString() });
    setAuthCookie(res, token);

    return res.status(200).json({
      success: true,
      message: "Logged in successfully",
      user: sanitizeUser(user),
    });
  } catch (error) {
    return next(error);
  }
}

async function me(req, res) {
  return res.status(200).json({
    success: true,
    user: sanitizeUser(req.user),
  });
}

function logout(_req, res) {
  clearAuthCookie(res);
  return res.status(200).json({ success: true, message: "Logged out successfully" });
}

module.exports = {
  register,
  login,
  me,
  logout,
};
