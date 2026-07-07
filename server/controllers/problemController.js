const Problem = require("../models/Problem");
const Match = require("../models/Match");
const { toPublicProblem } = require("../utils/problemPresenter");

async function getRandomProblem(req, res, next) {
  try {
    const userId = req.user?._id;
    let playedProblemIds = [];

    if (userId) {
      const playedMatches = await Match.find({
        "players.user": userId,
      }).select("problem");
      playedProblemIds = playedMatches.map((m) => m.problem).filter(Boolean);
    }

    let problem;
    const unplayedProblems = await Problem.aggregate([
      { $match: { _id: { $nin: playedProblemIds } } },
      { $sample: { size: 1 } },
    ]);

    if (unplayedProblems.length > 0) {
      problem = unplayedProblems[0];
    } else {
      // Fallback: pick any random problem if all have been played
      const randomProblems = await Problem.aggregate([
        { $sample: { size: 1 } },
      ]);
      if (randomProblems.length > 0) {
        problem = randomProblems[0];
      }
    }

    if (!problem) {
      return res.status(404).json({ success: false, message: "No problems found" });
    }

    return res.status(200).json({ success: true, problem: toPublicProblem(problem) });
  } catch (error) {
    return next(error);
  }
}

async function getProblemById(req, res, next) {
  try {
    const problem = await Problem.findById(req.params.id);
    if (!problem) {
      return res.status(404).json({ success: false, message: "Problem not found" });
    }
    return res.status(200).json({ success: true, problem: toPublicProblem(problem) });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getRandomProblem,
  getProblemById,
};
