const express = require("express");
const router = express.Router();
const authController = require("./auth.controller");
const isAdmin = require("../../middleware/admin.middleware");
const authMiddleware = require("../../middleware/auth.middleware");


router.post('/register', authController.register)
router.post('/login', authController.login)
router.get('/profile', authMiddleware, authController.getProfile)
router.get('/admin-dashboard', isAdmin, (req, res) => {
    res.status(200).json({ message: "Welcome to Admin Dashboard" });
})

module.exports = router;
