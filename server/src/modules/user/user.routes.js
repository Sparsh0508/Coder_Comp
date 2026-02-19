const express = require('express')
const router = express.Router();
const userController = require('./user.controller')
const authMiddleWare = require('../../middleware/auth.middleware')


router.get("/me",authMiddleWare,userController.getProfile)
router.get("/:id",authMiddleWare,userController.getUserById);

module.exports= router;
