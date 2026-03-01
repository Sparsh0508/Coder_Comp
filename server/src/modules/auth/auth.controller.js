const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const authService = require("./auth.service");
const { registerSchema } = require("./auth.validation");

const register = async (req, res) => {
  try {
    console.log("Heelos");

    const { error } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    const { username, email, password } = req.body;
    const existingUser = await authService.findUserByEmailOrUsername(email, username);
    if (existingUser) {
      return res.status(400).json({ message: "Email or username already exists" });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const userId = await authService.createUser(username, email, passwordHash);
    const token = jwt.sign(
      { id: userId, role: 'user' },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: userId,
        username,
        email,
        role: 'user'
      }
    });

  } catch (err) {
    return res.status(500).json({ message: "Registration failed" });
  }
};
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const existingUser = await authService.findUserByEmail(email);
    if (!existingUser) {
      return res.status(400).json({ message: "User doesn't exist" });
    }
    const isMatch = await bcrypt.compare(
      password,
      existingUser.password_hash
    );
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    const token = jwt.sign(
      {
        id: existingUser.id,
        email: existingUser.email,
        username: existingUser.username,
        rank: existingUser.rank,
        role: existingUser.role
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: existingUser.id,
        email: existingUser.email,
        username: existingUser.username,
        rank: existingUser.rank,
        rating: existingUser.rating,
        role: existingUser.role
      },
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};
const getProfile = async (req, res) => {
  return res.status(200).json({
    user: req.user
  });
};

module.exports = {
  register,
  login,
  getProfile
};
