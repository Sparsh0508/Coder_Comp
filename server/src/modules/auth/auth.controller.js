const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const authService = require("./auth.service");
const { registerSchema } = require("./auth.validation");

const register = async (req, res) => {
  try {
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
      { id: userId },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(201).json({
      message: "User registered successfully",
      token,
    });

  } catch (err) {
    return res.status(500).json({ message: "Registration failed" });
  }
};

module.exports = {
  register,
};
