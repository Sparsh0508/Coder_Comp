const Match = require("../models/Match");
const Problem = require("../models/Problem");
const Submission = require("../models/Submission");
const User = require("../models/User");
const { awardPrizePool } = require("../utils/matchEconomy");
const { evaluateCode } = require("../utils/executor");
const { calculateElo } = require("../utils/elo");

function buildMatchSummary(match, winnerId, winnerTeam, rewardSummary = {}) {
  return {
    matchId: match._id,
    winnerId,
    winnerTeam,
    endedAt: match.endedAt,
    status: match.status,
    prizePool: match.prizePool,
    rewardedUserIds: rewardSummary.rewardedUserIds || [],
    perWinnerReward: rewardSummary.perWinnerReward || 0,
  };
}

async function updateTeamRatings(match, winningTeam) {
  const winners = match.players.filter((player) => player.team === winningTeam);
  const losers = match.players.filter((player) => player.team !== winningTeam);

  if (!winners.length || !losers.length) {
    return;
  }

  const winnerUsers = await User.find({ _id: { $in: winners.map((player) => player.user._id) } });
  const loserUsers = await User.find({ _id: { $in: losers.map((player) => player.user._id) } });

  const averageWinnerRating = winnerUsers.reduce((sum, user) => sum + user.rating, 0) / winnerUsers.length;
  const averageLoserRating = loserUsers.reduce((sum, user) => sum + user.rating, 0) / loserUsers.length;
  const { winnerRating, loserRating } = calculateElo(averageWinnerRating, averageLoserRating);
  const winnerDelta = winnerRating - Math.round(averageWinnerRating);
  const loserDelta = loserRating - Math.round(averageLoserRating);

  winnerUsers.forEach((user) => {
    user.rating += winnerDelta;
    user.wins += 1;
    user.totalMatches += 1;
  });

  loserUsers.forEach((user) => {
    user.rating += loserDelta;
    user.losses += 1;
    user.totalMatches += 1;
  });

  await Promise.all([...winnerUsers, ...loserUsers].map((user) => user.save()));
}

async function runCode(req, res, next) {
  try {
    const { problemId, code, language } = req.body;

    if (!problemId || !code || !language) {
      return res.status(400).json({ success: false, message: "problemId, code and language are required" });
    }

    const problem = await Problem.findById(problemId);

    if (!problem) {
      return res.status(404).json({ success: false, message: "Problem not found" });
    }

    const evaluation = await evaluateCode({
      sourceCode: code,
      language,
      testCases: problem.sampleTestCases,
    });

    const submission = await Submission.create({
      user: req.user._id,
      problem: problem._id,
      type: "run",
      code,
      language,
      passedTests: evaluation.passedCount,
      totalTests: evaluation.totalCount,
      executionTime: evaluation.maxTime,
      memory: evaluation.maxMemory,
      output: evaluation.outputSummary,
      status: evaluation.allPassed ? "accepted" : "failed",
    });

    return res.status(200).json({
      success: true,
      message: "Sample tests executed",
      submissionId: submission._id,
      result: evaluation,
    });
  } catch (error) {
    return next(error);
  }
}

async function submitCode(req, res, next) {
  try {
    const { matchId, code, language } = req.body;

    if (!matchId || !code || !language) {
      return res.status(400).json({ success: false, message: "matchId, code and language are required" });
    }

    const match = await Match.findById(matchId)
      .populate("problem")
      .populate("players.user", "username rating coinBalance");

    if (!match) {
      return res.status(404).json({ success: false, message: "Match not found" });
    }

    const playerIndex = match.players.findIndex((player) => player.user._id.toString() === req.user._id.toString());

    if (playerIndex === -1) {
      return res.status(403).json({ success: false, message: "You are not a participant in this match" });
    }

    const testCases = [...match.problem.sampleTestCases, ...match.problem.hiddenTestCases];
    const evaluation = await evaluateCode({
      sourceCode: code,
      language,
      testCases,
    });

    const submission = await Submission.create({
      user: req.user._id,
      match: match._id,
      problem: match.problem._id,
      type: "submit",
      code,
      language,
      passedTests: evaluation.passedCount,
      totalTests: evaluation.totalCount,
      executionTime: evaluation.maxTime,
      memory: evaluation.maxMemory,
      output: evaluation.outputSummary,
      status: evaluation.allPassed ? "accepted" : "failed",
    });

    const player = match.players[playerIndex];
    player.latestLanguage = language;
    player.hasSubmitted = true;
    player.status = evaluation.allPassed ? "accepted" : "submitted";
    player.passedTests = evaluation.passedCount;
    player.totalTests = evaluation.totalCount;
    player.lastSubmissionAt = new Date();
    player.lastSubmissionId = submission._id;
    player.isTyping = false;

    let winnerUserId = null;
    let winnerTeam = null;
    let rewardSummary = {};

    if (evaluation.allPassed && match.status !== "completed") {
      winnerUserId = req.user._id.toString();
      winnerTeam = player.team;
      match.status = "completed";
      match.winner = req.user._id;
      match.winnerTeam = player.team;
      match.endedAt = new Date();
      submission.isWinnerSubmission = true;
      await submission.save();

      match.players.forEach((entry) => {
        if (entry.team === player.team) {
          entry.status = "accepted";
        } else {
          entry.status = "defeated";
          entry.isTyping = false;
        }
      });

      await updateTeamRatings(match, player.team);
      rewardSummary = await awardPrizePool(match, player.team);
    }

    await match.save();

    const io = req.app.get("io");
    io.to(match.roomId).emit("submissionResult", {
      matchId: match._id.toString(),
      userId: req.user._id.toString(),
      username: req.user.username,
      language,
      team: player.team,
      passedTests: evaluation.passedCount,
      totalTests: evaluation.totalCount,
      allPassed: evaluation.allPassed,
      submittedAt: player.lastSubmissionAt,
    });

    if (winnerUserId) {
      io.to(match.roomId).emit("matchEnd", buildMatchSummary(match, winnerUserId, winnerTeam, rewardSummary));
    }

    return res.status(200).json({
      success: true,
      message: evaluation.allPassed ? "Accepted. Your team won the match." : "Submission evaluated",
      submissionId: submission._id,
      result: evaluation,
      match: buildMatchSummary(match, winnerUserId, winnerTeam, rewardSummary),
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  runCode,
  submitCode,
};
