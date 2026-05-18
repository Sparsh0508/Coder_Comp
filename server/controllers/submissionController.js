const Match = require("../models/Match");
const Problem = require("../models/Problem");
const Submission = require("../models/Submission");
const { awardPrizePool } = require("../utils/matchEconomy");
const { clearUsersActiveMatch } = require("../utils/userMatchState");
const { evaluateCode } = require("../utils/executor");
const { applyMatchStatsOnce } = require("../utils/matchStats");

function publicEvaluation(evaluation, includeCases = false, extra = {}) {
  const base = {
    allPassed: evaluation.allPassed,
    passedCount: evaluation.passedCount,
    totalCount: evaluation.totalCount,
    maxTime: evaluation.maxTime,
    maxMemory: evaluation.maxMemory,
    ...extra,
  };

  if (includeCases) {
    base.testCases = evaluation.testCases;
    base.outputSummary = evaluation.outputSummary;
  }

  return base;
}

function buildHiddenSummary(evaluation, sampleCount) {
  const hiddenResults = evaluation.testCases.slice(sampleCount);

  return {
    hiddenPassedCount: hiddenResults.filter((result) => result.passed).length,
    hiddenTotalCount: hiddenResults.length,
  };
}

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
      result: publicEvaluation(evaluation, true),
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
      .populate({
        path: "problem",
        select: "+hiddenTestCases +hiddenTests",
      })
      .populate("players.user", "username rating coinBalance");

    if (!match) {
      return res.status(404).json({ success: false, message: "Match not found" });
    }

    const playerIndex = match.players.findIndex((player) => player.user._id.toString() === req.user._id.toString());

    if (playerIndex === -1) {
      return res.status(403).json({ success: false, message: "You are not a participant in this match" });
    }

    const hiddenTestCases =
      match.problem.hiddenTestCases?.length
        ? match.problem.hiddenTestCases
        : (match.problem.hiddenTests || []);

    const testCases = [...(match.problem.sampleTestCases || []), ...hiddenTestCases];

    if (!testCases.length) {
      return res.status(400).json({ success: false, message: "Problem has no judge test cases" });
    }

    const io = req.app.get("io");
    const sampleCount = match.problem.sampleTestCases?.length || 0;
    const evaluation = await evaluateCode({
      sourceCode: code,
      language,
      testCases,
      onProgress({ results }) {
        const hiddenResults = results.slice(sampleCount);

        io.to(match.roomId).emit("submissionProgress", {
          matchId: match._id.toString(),
          userId: req.user._id.toString(),
          username: req.user.username,
          language,
          team: match.players[playerIndex].team,
          passedTests: results.filter((result) => result.passed).length,
          totalTests: testCases.length,
          completedTests: results.length,
          hiddenPassedCount: hiddenResults.filter((result) => result.passed).length,
          hiddenTotalCount: hiddenTestCases.length,
          hiddenCompletedCount: hiddenResults.length,
        });
      },
    });
    const hiddenSummary = buildHiddenSummary(evaluation, sampleCount);

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

    const freshMatch = await Match.findById(matchId).populate("players.user", "username rating coinBalance");

    if (!freshMatch || !["lobby", "active"].includes(freshMatch.status)) {
      return res.status(200).json({
        success: true,
        message: "Submission evaluated, but the match had already ended.",
        submissionId: submission._id,
        result: publicEvaluation(evaluation, false, hiddenSummary),
        match: freshMatch
          ? buildMatchSummary(
              freshMatch,
              freshMatch.winner ? freshMatch.winner.toString() : null,
              freshMatch.winnerTeam,
              {}
            )
          : null,
      });
    }

    const freshPlayerIndex = freshMatch.players.findIndex(
      (entry) => entry.user._id.toString() === req.user._id.toString()
    );

    if (freshPlayerIndex === -1) {
      return res.status(403).json({ success: false, message: "You are not a participant in this match" });
    }

    const player = freshMatch.players[freshPlayerIndex];
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
      freshMatch.status = "completed";
      freshMatch.winner = req.user._id;
      freshMatch.winnerTeam = player.team;
      freshMatch.endedAt = new Date();
      submission.isWinnerSubmission = true;
      await submission.save();

      freshMatch.players.forEach((entry) => {
        if (entry.team === player.team) {
          entry.status = "accepted";
        } else {
          entry.status = "defeated";
          entry.isTyping = false;
        }
      });

      const completion = await Match.updateOne(
        { _id: freshMatch._id, status: { $in: ["lobby", "active"] } },
        {
          $set: {
            status: "completed",
            winner: req.user._id,
            winnerTeam: player.team,
            endedAt: freshMatch.endedAt,
            players: freshMatch.players,
          },
        }
      );

      if (!completion.modifiedCount) {
        const endedMatch = await Match.findById(matchId);
        return res.status(200).json({
          success: true,
          message: "Submission evaluated, but the match had already ended.",
          submissionId: submission._id,
          result: publicEvaluation(evaluation, false, hiddenSummary),
          match: endedMatch
            ? buildMatchSummary(
                endedMatch,
                endedMatch.winner ? endedMatch.winner.toString() : null,
                endedMatch.winnerTeam,
                {}
              )
            : null,
        });
      }

      await applyMatchStatsOnce(freshMatch, player.team);
      rewardSummary = await awardPrizePool(freshMatch, player.team);
    } else {
      await Match.updateOne(
        { _id: freshMatch._id, status: { $in: ["lobby", "active"] }, "players.user": req.user._id },
        {
          $set: {
            "players.$.latestLanguage": language,
            "players.$.hasSubmitted": true,
            "players.$.status": player.status,
            "players.$.passedTests": evaluation.passedCount,
            "players.$.totalTests": evaluation.totalCount,
            "players.$.lastSubmissionAt": player.lastSubmissionAt,
            "players.$.lastSubmissionId": submission._id,
            "players.$.isTyping": false,
          },
        }
      );
    }

    io.to(freshMatch.roomId).emit("submissionResult", {
      matchId: freshMatch._id.toString(),
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
      await clearUsersActiveMatch(freshMatch.players.map((entry) => entry.user._id.toString()));
      io.to(freshMatch.roomId).emit("matchEnd", buildMatchSummary(freshMatch, winnerUserId, winnerTeam, rewardSummary));
    }

    return res.status(200).json({
      success: true,
      message: evaluation.allPassed ? "Accepted. Your team won the match." : "Submission evaluated",
      submissionId: submission._id,
      result: publicEvaluation(evaluation, false, hiddenSummary),
      match: buildMatchSummary(freshMatch, winnerUserId, winnerTeam, rewardSummary),
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  runCode,
  submitCode,
};
