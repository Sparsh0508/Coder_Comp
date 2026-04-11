const express = require("express");

const submissionController = require("../controllers/submissionController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/run", authMiddleware, submissionController.runCode);
router.post("/submit", authMiddleware, submissionController.submitCode);

module.exports = router;
