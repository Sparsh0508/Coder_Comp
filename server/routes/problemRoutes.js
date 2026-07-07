const express = require("express");

const problemController = require("../controllers/problemController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/random", authMiddleware, problemController.getRandomProblem);
router.get("/:id", authMiddleware, problemController.getProblemById);

module.exports = router;
