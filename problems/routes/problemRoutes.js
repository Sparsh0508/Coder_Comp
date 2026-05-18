const express = require('express');
const router = express.Router();    
const generateProblem = require('../generators/problemGenerator');
const { toPublicProblem } = require('../../server/utils/problemPresenter');
const { families } = require('../specs/problemFamilies');

router.get('/families', (_req, res) => {
    res.json({
        success: true,
        families: families.map((family) => ({
            id: family.id,
            label: family.label
        }))
    });
});

router.get('/generate', async (req, res) => {
    try {
        const difficulty = req.query.difficulty || 'easy';
        const problem = await generateProblem(difficulty, {
            family: req.query.family,
            pattern: req.query.pattern
        });
        res.json({
            success: true,
            problem: toPublicProblem(problem)
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate problem',
            message: error.message
        });
    }
});

module.exports = router;
