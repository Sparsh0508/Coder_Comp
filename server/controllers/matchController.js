const Match = require("../models/Match");
const Problem = require("../models/Problem");
const { enqueuePlayer, getQueueSummary, removeQueuedPlayer, getSupportedModes } = require("../sockets/matchmakingSocket");
const { getEntryCoins } = require("../utils/matchConfig");
const { refundEntryCoins } = require("../utils/matchEconomy");
const { forfeitMatchByUser } = require("../utils/matchForfeit");
const { clearUsersActiveMatch } = require("../utils/userMatchState");
const { toPublicProblem } = require("../utils/problemPresenter");

function buildMatchEndSummary(match, reason) {
  return {
    matchId: match._id.toString(),
    winnerId: match.winner ? match.winner.toString() : null,
    winnerTeam: match.winnerTeam,
    endedAt: match.endedAt,
    status: match.status,
    prizePool: match.prizePool,
    rewardedUserIds: [],
    perWinnerReward: 0,
    reason,
  };
}

function formatPlayer(player) {
  return {
    id: player.user._id,
    username: player.user.username,
    rating: player.user.rating,
    coinBalance: player.user.coinBalance ?? player.balanceAfterEntry,
    team: player.team,
    coinContribution: player.coinContribution,
    balanceAfterEntry: player.balanceAfterEntry,
    status: player.status,
    language: player.latestLanguage,
    isTyping: player.isTyping,
    passedTests: player.passedTests,
    totalTests: player.totalTests,
    hasSubmitted: player.hasSubmitted,
  };
}

function formatMatch(match, userId) {
  const currentPlayer = match.players.find((player) => player.user._id.toString() === userId);
  const teammates = currentPlayer
    ? match.players.filter(
        (player) => player.team === currentPlayer.team && player.user._id.toString() !== userId
      )
    : [];
  const opponents = currentPlayer
    ? match.players.filter((player) => player.team !== currentPlayer.team)
    : [];

  return {
    id: match._id,
    roomId: match.roomId,
    mode: match.mode,
    teamSize: match.teamSize,
    entryCoins: match.entryCoins,
    prizePool: match.prizePool,
    status: match.status,
    lobbyEndsAt: match.lobbyEndsAt,
    matchStartsAt: match.matchStartsAt,
    countdownEndsAt: match.countdownEndsAt,
    startedAt: match.startedAt,
    endedAt: match.endedAt,
    winner: match.winner,
    winnerTeam: match.winnerTeam,
    currentPlayer: currentPlayer ? formatPlayer(currentPlayer) : null,
    teammates: teammates.map(formatPlayer),
    opponents: opponents.map(formatPlayer),
    problem: toPublicProblem(match.problem),
  };
}

function formatRecentMatch(match, userId) {
  const currentPlayer = match.players.find((player) => player.user._id.toString() === userId);
  const opponents = currentPlayer
    ? match.players.filter((player) => player.team !== currentPlayer.team)
    : [];
  const result =
    !match.winnerTeam || !currentPlayer
      ? "D"
      : match.winnerTeam === currentPlayer.team
        ? "W"
        : "L";

  return {
    id: match._id,
    result,
    mode: match.mode,
    opponent: opponents.map((player) => player.user.username).join(", ") || "Opponent",
    problem: match.problem?.title || "Unknown problem",
    endedAt: match.endedAt || match.updatedAt,
    prizePool: match.prizePool,
  };
}

async function findMatch(req, res, next) {
  try {
    const io = req.app.get("io");
    const socketId = req.body.socketId;
    const mode = req.body.mode || "1v1";

    if (!socketId) {
      return res.status(400).json({ success: false, message: "A connected socketId is required" });
    }

    if (!getSupportedModes().includes(mode)) {
      return res.status(400).json({ success: false, message: "Unsupported match mode" });
    }

    if ((req.user.coinBalance || 0) < getEntryCoins(mode)) {
      return res.status(400).json({
        success: false,
        message: `You need at least ${getEntryCoins(mode)} coins to enter a ${mode} match`,
      });
    }

    if (req.user.activeMatchId && req.user.activeMatchStatus !== "available") {
      return res.status(409).json({
        success: false,
        message: "You already have an active match. Rejoin the ongoing match instead.",
        activeMatchId: req.user.activeMatchId,
        activeMatchStatus: req.user.activeMatchStatus,
      });
    }

    const problemCount = await Problem.countDocuments();
    if (!problemCount) {
      return res.status(400).json({ success: false, message: "No problems are available. Seed the database first." });
    }

    const queueResult = await enqueuePlayer(io, {
      userId: req.user._id.toString(),
      username: req.user.username,
      rating: req.user.rating,
      socketId,
      mode,
    });

    return res.status(200).json({
      success: true,
      ...queueResult,
    });
  } catch (error) {
    return next(error);
  }
}

async function getRecentMatches(req, res, next) {
  try {
    const userId = req.user._id.toString();
    const matches = await Match.find({
      "players.user": req.user._id,
      status: "completed",
    })
      .sort({ endedAt: -1, updatedAt: -1 })
      .limit(6)
      .populate("problem", "title difficulty")
      .populate("players.user", "username rating");

    return res.status(200).json({
      success: true,
      matches: matches.map((match) => formatRecentMatch(match, userId)),
    });
  } catch (error) {
    return next(error);
  }
}

async function leaveQueue(req, res, next) {
  try {
    const mode = req.body.mode;
    removeQueuedPlayer(req.user._id.toString(), mode);
    return res.status(200).json({
      success: true,
      message: "Removed from matchmaking queue",
      ...(mode ? getQueueSummary(mode) : {}),
    });
  } catch (error) {
    return next(error);
  }
}

async function getActiveMatch(req, res) {
  return res.status(200).json({
    success: true,
    activeMatch: req.user.activeMatchId
      ? {
          matchId: req.user.activeMatchId,
          status: req.user.activeMatchStatus,
        }
      : null,
  });
}

async function getMatch(req, res, next) {
  try {
    const match = await Match.findById(req.params.matchId)
      .populate("problem")
      .populate("players.user", "username rating coinBalance")
      .populate("winner", "username rating coinBalance");

    if (!match) {
      return res.status(404).json({ success: false, message: "Match not found" });
    }

    const isParticipant = match.players.some((player) => player.user._id.toString() === req.user._id.toString());

    if (!isParticipant) {
      return res.status(403).json({ success: false, message: "You are not a participant in this match" });
    }

    return res.status(200).json({
      success: true,
      match: formatMatch(match, req.user._id.toString()),
    });
  } catch (error) {
    return next(error);
  }
}

async function timeoutMatch(req, res, next) {
  try {
    const match = await Match.findById(req.params.matchId)
      .populate("problem")
      .populate("players.user", "username rating coinBalance")
      .populate("winner", "username rating coinBalance");

    if (!match) {
      return res.status(404).json({ success: false, message: "Match not found" });
    }

    const isParticipant = match.players.some((player) => player.user._id.toString() === req.user._id.toString());

    if (!isParticipant) {
      return res.status(403).json({ success: false, message: "You are not a participant in this match" });
    }

    if (["completed", "cancelled"].includes(match.status)) {
      return res.status(200).json({
        success: true,
        match: formatMatch(match, req.user._id.toString()),
        result: buildMatchEndSummary(match, "Match already ended"),
      });
    }

    const now = Date.now();
    const countdownEndsAt = match.countdownEndsAt ? new Date(match.countdownEndsAt).getTime() : 0;

    if (countdownEndsAt && now < countdownEndsAt) {
      return res.status(400).json({ success: false, message: "Match timer has not expired yet" });
    }

    match.status = "completed";
    match.winner = null;
    match.winnerTeam = null;
    match.endedAt = new Date();

    match.players.forEach((player) => {
      if (player.status !== "disconnected") {
        player.status = "defeated";
      }
      player.isTyping = false;
    });

    await refundEntryCoins(match);
    await match.save();
    await clearUsersActiveMatch(match.players.map((player) => player.user._id.toString()));

    const io = req.app.get("io");
    if (io) {
      io.to(match.roomId).emit("matchEnd", buildMatchEndSummary(match, "Time expired"));
    }

    return res.status(200).json({
      success: true,
      match: formatMatch(match, req.user._id.toString()),
      result: buildMatchEndSummary(match, "Time expired"),
    });
  } catch (error) {
    return next(error);
  }
}

async function forfeitMatch(req, res, next) {
  try {
    const matchId = req.params.matchId;
    const io = req.app.get("io");
    const userId = req.user._id.toString();

    const outcome = await forfeitMatchByUser({
      io,
      matchId,
      userId,
      reason: "Player left the match",
    });

    if (!outcome?.match) {
      return res.status(404).json({ success: false, message: "Match not found or already ended" });
    }

    return res.status(200).json({
      success: true,
      match: formatMatch(outcome.match, userId),
      result: buildMatchEndSummary(outcome.match, "Player left the match"),
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  findMatch,
  getRecentMatches,
  leaveQueue,
  getMatch,
  getActiveMatch,
  timeoutMatch,
  forfeitMatch,
};
