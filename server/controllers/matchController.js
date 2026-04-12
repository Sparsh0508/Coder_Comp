const Match = require("../models/Match");
const Problem = require("../models/Problem");
const { enqueuePlayer, getQueueSummary, removeQueuedPlayer, getSupportedModes } = require("../sockets/matchmakingSocket");
const { getEntryCoins } = require("../utils/matchConfig");

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
    problem: match.problem,
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

module.exports = {
  findMatch,
  leaveQueue,
  getMatch,
};
