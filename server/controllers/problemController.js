const Problem = require("../models/Problem");

async function getRandomProblem(_req, res, next) {
  try {
    const [problem] = await Problem.aggregate([{ $sample: { size: 1 } }]);

    if (!problem) {
      return res.status(404).json({ success: false, message: "No problems found" });
    }

    return res.status(200).json({ success: true, problem });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getRandomProblem,
};
