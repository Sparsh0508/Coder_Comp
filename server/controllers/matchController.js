const Match = require("../models/Match");
const Problem = require("../models/Problem");
const { enqueuePlayer, removeQueuedPlayer } = require("../sockets/matchmakingSocket");

function formatMatch(match, userId) {
  const currentPlayer = match.players.find((player) => player.user._id.toString() === userId);
  const opponent = match.players.find((player) => player.user._id.toString() !== userId);

  return {
    id: match._id,
    roomId: match.roomId,
    status: match.status,
    countdownEndsAt: match.countdownEndsAt,
    startedAt: match.startedAt,
    endedAt: match.endedAt,
    winner: match.winner,
    currentPlayer: currentPlayer
      ? {
          id: currentPlayer.user._id,
          username: currentPlayer.user.username,
          rating: currentPlayer.user.rating,
          status: currentPlayer.status,
          language: currentPlayer.latestLanguage,
          passedTests: currentPlayer.passedTests,
          totalTests: currentPlayer.totalTests,
          hasSubmitted: currentPlayer.hasSubmitted,
        }
      : null,
    opponent: opponent
      ? {
          id: opponent.user._id,
          username: opponent.user.username,
          rating: opponent.user.rating,
          status: opponent.status,
          language: opponent.latestLanguage,
          isTyping: opponent.isTyping,
          passedTests: opponent.passedTests,
          totalTests: opponent.totalTests,
          hasSubmitted: opponent.hasSubmitted,
        }
      : null,
    problem: match.problem,
  };
}

async function findMatch(req, res, next) {
  try {
    const io = req.app.get("io");
    const socketId = req.body.socketId;

    if (!socketId) {
      return res.status(400).json({ success: false, message: "A connected socketId is required" });
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
    removeQueuedPlayer(req.user._id.toString());
    return res.status(200).json({ success: true, message: "Removed from matchmaking queue" });
  } catch (error) {
    return next(error);
  }
}

async function getMatch(req, res, next) {
  try {
    const match = await Match.findById(req.params.matchId)
      .populate("problem")
      .populate("players.user", "username rating")
      .populate("winner", "username rating");

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
