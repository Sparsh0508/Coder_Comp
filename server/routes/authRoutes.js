const express = require("express");

const authController = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/logout", authMiddleware, authController.logout);
router.get("/me", authMiddleware, authController.me);
router.put("/profile", authMiddleware, authController.updateProfile);
router.get("/wallet", authMiddleware, authController.getWallet);
router.get("/socket-token", authMiddleware, authController.getSocketToken);
router.post("/wallet/deposit/order", authMiddleware, authController.createDepositOrder);
router.post("/wallet/deposit/verify", authMiddleware, authController.verifyDepositOrder);
router.post("/wallet/deposit", authMiddleware, authController.depositCoins);
router.post("/wallet/withdraw", authMiddleware, authController.withdrawCoins);

module.exports = router;
