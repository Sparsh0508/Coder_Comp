const express = require('express');
const router = express.Router();    
const generateProblem = require('../generators/problemGenerator');

router.get('/generate', async (req, res) => {
    try {
        const difficulty = req.query.difficulty || 'easy';
        const problem = await generateProblem(difficulty);
        res.json(problem);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to generate problem' });
    }
});

module.exports = router;
