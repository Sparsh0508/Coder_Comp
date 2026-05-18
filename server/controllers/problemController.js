const Problem = require("../models/Problem");
const { toPublicProblem } = require("../utils/problemPresenter");

async function getRandomProblem(_req, res, next) {
  try {
    const count = await Problem.countDocuments();

    if (!count) {
      return res.status(404).json({ success: false, message: "No problems found" });
    }

    const problem = await Problem.findOne()
      .skip(Math.floor(Math.random() * count));

    return res.status(200).json({ success: true, problem: toPublicProblem(problem) });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getRandomProblem,
};
