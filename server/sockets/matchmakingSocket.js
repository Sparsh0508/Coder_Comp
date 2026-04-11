const Match = require("../models/Match");
const Problem = require("../models/Problem");

const matchmakingQueue = [];
const connectedUsers = new Map();

async function createMatch(io, playerOne, playerTwo) {
  const [problem] = await Problem.aggregate([{ $sample: { size: 1 } }]);

  if (!problem) {
    throw new Error("No problems available for matchmaking");
  }

  const countdownEndsAt = new Date(Date.now() + 30 * 60 * 1000);
  const roomId = `match_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const match = await Match.create({
    roomId,
    players: [
      { user: playerOne.userId, socketId: playerOne.socketId, latestLanguage: "cpp" },
      { user: playerTwo.userId, socketId: playerTwo.socketId, latestLanguage: "cpp" },
    ],
    problem: problem._id,
    countdownEndsAt,
  });

  const hydratedMatch = await Match.findById(match._id)
    .populate("problem")
    .populate("players.user", "username rating");

  [playerOne.socketId, playerTwo.socketId].forEach((socketId) => {
    const socket = io.sockets.sockets.get(socketId);
    if (socket) {
      socket.join(roomId);
    }
  });

  hydratedMatch.players.forEach((player) => {
    const socket = io.sockets.sockets.get(player.socketId);
    const opponent = hydratedMatch.players.find((entry) => entry.user._id.toString() !== player.user._id.toString());

    if (socket) {
      socket.emit("matchFound", {
        matchId: hydratedMatch._id.toString(),
        roomId,
        countdownEndsAt,
        opponent: {
          id: opponent.user._id,
          username: opponent.user.username,
          rating: opponent.user.rating,
        },
      });

      socket.emit("startMatch", {
        matchId: hydratedMatch._id.toString(),
        roomId,
        countdownEndsAt,
        problem: hydratedMatch.problem,
      });
    }
  });

  return hydratedMatch;
}

async function maybeCreateMatch(io) {
  while (matchmakingQueue.length >= 2) {
    const playerOne = matchmakingQueue.shift();
    const playerTwo = matchmakingQueue.shift();
    await createMatch(io, playerOne, playerTwo);
  }
}

async function enqueuePlayer(io, player) {
  const existing = matchmakingQueue.find((entry) => entry.userId === player.userId);

  if (existing) {
    existing.socketId = player.socketId;
    return {
      queued: true,
      queueSize: matchmakingQueue.length,
      message: "You are already in the queue",
    };
  }

  matchmakingQueue.push(player);
  await maybeCreateMatch(io);

  return {
    queued: true,
    queueSize: matchmakingQueue.length,
    message: "You have joined the queue",
  };
}

function removeQueuedPlayer(userId) {
  const index = matchmakingQueue.findIndex((entry) => entry.userId === userId);
  if (index >= 0) {
    matchmakingQueue.splice(index, 1);
  }
}

function registerMatchmakingHandlers(io) {
  io.on("connection", (socket) => {
    connectedUsers.set(socket.user.id, socket.id);

    socket.on("joinQueue", async () => {
      try {
        const result = await enqueuePlayer(io, {
          userId: socket.user.id,
          username: socket.user.username,
          rating: socket.user.rating,
          socketId: socket.id,
        });

        socket.emit("queueJoined", result);
      } catch (error) {
        socket.emit("queueError", { message: error.message });
      }
    });

    socket.on("leaveQueue", () => {
      removeQueuedPlayer(socket.user.id);
      socket.emit("queueLeft", { success: true });
    });

    socket.on("joinMatchRoom", ({ roomId }) => {
      if (roomId) {
        socket.join(roomId);
      }
    });

    socket.on("codeUpdate", ({ roomId, language, isTyping }) => {
      socket.to(roomId).emit("codeUpdate", {
        userId: socket.user.id,
        username: socket.user.username,
        language,
        isTyping: Boolean(isTyping),
      });
    });

    socket.on("disconnect", async () => {
      connectedUsers.delete(socket.user.id);
      removeQueuedPlayer(socket.user.id);

      const activeMatch = await Match.findOne({
        "players.socketId": socket.id,
        status: "active",
      }).populate("players.user", "username rating");

      if (!activeMatch) {
        return;
      }

      const disconnectedPlayer = activeMatch.players.find((player) => player.socketId === socket.id);
      if (disconnectedPlayer) {
        disconnectedPlayer.status = "disconnected";
      }

      const opponent = activeMatch.players.find((player) => player.socketId !== socket.id);
      if (opponent) {
        activeMatch.status = "completed";
        activeMatch.winner = opponent.user._id;
        activeMatch.endedAt = new Date();
      }

      await activeMatch.save();

      io.to(activeMatch.roomId).emit("matchEnd", {
        matchId: activeMatch._id.toString(),
        winnerId: opponent ? opponent.user._id.toString() : null,
        endedAt: activeMatch.endedAt,
        status: activeMatch.status,
        reason: "Opponent disconnected",
      });
    });
  });
}

module.exports = {
  registerMatchmakingHandlers,
  enqueuePlayer,
  removeQueuedPlayer,
};
