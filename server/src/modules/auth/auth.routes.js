const express = require("express");
const router = express.Router();
const authController = require("./auth.controller");
const isAdmin = require("../../middleware/admin.middleware");


router.post('/register', authController.register)
router.post('/login', authController.login)
router.get('/profile', authController.getProfile)
router.get('/admin-dashboard', isAdmin, (req, res) => {
    res.status(200).json({ message: "Welcome to Admin Dashboard" });
})

module.exports = router;
