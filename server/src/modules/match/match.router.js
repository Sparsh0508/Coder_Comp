
const express = require('express');
const router = express.Router();
const matchController = require('./match.controller');
const authMiddleware = require('../../middleware/auth.middleware');

router.get('/:id', authMiddleware, matchController.getMatchById);

module.exports = router;
