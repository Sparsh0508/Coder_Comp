const express = require("express");

const matchController = require("../controllers/matchController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/find", authMiddleware, matchController.findMatch);
router.post("/leave", authMiddleware, matchController.leaveQueue);
router.get("/active/current", authMiddleware, matchController.getActiveMatch);
router.get("/:matchId", authMiddleware, matchController.getMatch);

module.exports = router;
