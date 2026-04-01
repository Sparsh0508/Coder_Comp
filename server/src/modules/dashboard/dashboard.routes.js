const express = require("express");
const { getDashboard } = require("./dashboard.controller.js");
const authMiddleware = require("../../middleware/auth.middleware.js");
const router = express.Router();

router.get("/", authMiddleware, getDashboard)
module.exports = router
