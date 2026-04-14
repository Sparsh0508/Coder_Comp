const Match = require("../models/Match");
const Problem = require("../models/Problem");
const { awardPrizePool, deductEntryCoins, refundEntryCoins } = require("../utils/matchEconomy");
const { logMatch, logWarn } = require("../utils/logger");
const { clearUsersActiveMatch, setUsersActiveMatch } = require("../utils/userMatchState");
const {
  LOBBY_DURATION_MS,
  MATCH_DURATION_MS,
  getEntryCoins,
  getRequiredPlayers,
  getSupportedModes,
  getTeamSize,
} = require("../utils/matchConfig");

const matchmakingQueues = new Map(getSupportedModes().map((mode) => [mode, []]));
const connectedUsers = new Map();
const lobbyTimers = new Map();

function getQueueCandidates(mode) {
  return [...getQueue(mode)].sort((a, b) => {
    if (a.rating === b.rating) {
      return new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime();
    }

    return a.rating - b.rating;
  });
}

function getQueue(mode) {
  return matchmakingQueues.get(mode) || matchmakingQueues.get("1v1");
}

function getQueueSummary(mode) {
  const queue = getQueue(mode);
  const requiredPlayers = getRequiredPlayers(mode);

  return {
    mode,
    queueSize: queue.length,
    requiredPlayers,
    spotsLeft: Math.max(requiredPlayers - queue.length, 0),
  };
}

function emitQueueUpdate(io, mode) {
  const payload = getQueueSummary(mode);

  getQueue(mode).forEach(({ socketId }) => {
    const socket = io.sockets.sockets.get(socketId);
    if (socket) {
      socket.emit("queueUpdate", payload);
    }
  });
}

function buildTeamPayload(players) {
  return players.map((player) => ({
    id: player.user._id,
    username: player.user.username,
    rating: player.user.rating,
    coinBalance: player.user.coinBalance,
    team: player.team,
    coinContribution: player.coinContribution,
    balanceAfterEntry: player.balanceAfterEntry,
  }));
}

function buildLobbyPayload(match) {
  return {
    matchId: match._id.toString(),
    roomId: match.roomId,
    mode: match.mode,
    teamSize: match.teamSize,
    entryCoins: match.entryCoins,
    prizePool: match.prizePool,
    lobbyEndsAt: match.lobbyEndsAt,
    matchStartsAt: match.matchStartsAt,
    countdownEndsAt: match.countdownEndsAt,
    status: match.status,
  };
}

function selectBalancedPlayers(mode) {
  const queue = getQueue(mode);
  const requiredPlayers = getRequiredPlayers(mode);

  if (queue.length < requiredPlayers) {
    return null;
  }

  const candidates = getQueueCandidates(mode);
  let bestWindow = candidates.slice(0, requiredPlayers);
  let bestSpread = bestWindow[bestWindow.length - 1].rating - bestWindow[0].rating;

  for (let index = 1; index <= candidates.length - requiredPlayers; index += 1) {
    const window = candidates.slice(index, index + requiredPlayers);
    const spread = window[window.length - 1].rating - window[0].rating;

    if (spread < bestSpread) {
      bestWindow = window;
      bestSpread = spread;
    }
  }

  const selectedUserIds = new Set(bestWindow.map((player) => player.userId));

  for (let index = queue.length - 1; index >= 0; index -= 1) {
    if (selectedUserIds.has(queue[index].userId)) {
      queue.splice(index, 1);
    }
  }

  return bestWindow;
}

function scheduleLobbyStart(io, matchId) {
  if (lobbyTimers.has(matchId)) {
    clearTimeout(lobbyTimers.get(matchId));
  }

  const timer = setTimeout(async () => {
    try {
      const match = await Match.findById(matchId).populate("problem");

      if (!match || match.status !== "lobby") {
        return;
      }

      match.status = "active";
      await match.save();
      await setUsersActiveMatch(
        match.players.map((player) => (player.user._id || player.user).toString()),
        match._id,
        "active"
      );

      logMatch("Match started", { matchId: match._id.toString(), mode: match.mode });

      io.to(match.roomId).emit("matchStarted", {
        matchId: match._id.toString(),
        roomId: match.roomId,
        matchStartsAt: match.matchStartsAt,
        countdownEndsAt: match.countdownEndsAt,
        problem: match.problem,
      });
    } finally {
      lobbyTimers.delete(matchId);
    }
  }, LOBBY_DURATION_MS);

  lobbyTimers.set(matchId, timer);
}

async function createMatch(io, queuedPlayers, mode) {
  const [problem] = await Problem.aggregate([{ $sample: { size: 1 } }]);

  if (!problem) {
    throw new Error("No problems available for matchmaking");
  }

  const teamSize = getTeamSize(mode);
  const entryCoins = getEntryCoins(mode);
  const deduction = await deductEntryCoins(
    queuedPlayers.map((player) => player.userId),
    entryCoins
  );

  if (!deduction.success) {
    const insufficientSet = new Set(deduction.insufficientUserIds);
    const eligiblePlayers = queuedPlayers.filter((player) => !insufficientSet.has(player.userId));

    eligiblePlayers.forEach((player) => getQueue(mode).unshift(player));
    queuedPlayers
      .filter((player) => insufficientSet.has(player.userId))
      .forEach((player) => {
        const socket = io.sockets.sockets.get(player.socketId);
        if (socket) {
          socket.emit("queueError", { message: "Insufficient coins for this match entry." });
        }
      });

    emitQueueUpdate(io, mode);
    return null;
  }

  const lobbyEndsAt = new Date(Date.now() + LOBBY_DURATION_MS);
  const matchStartsAt = lobbyEndsAt;
  const countdownEndsAt = new Date(matchStartsAt.getTime() + MATCH_DURATION_MS);
  const roomId = `match_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const match = await Match.create({
    roomId,
    mode,
    teamSize,
    entryCoins,
    prizePool: entryCoins * queuedPlayers.length,
    lobbyEndsAt,
    matchStartsAt,
    countdownEndsAt,
    players: queuedPlayers.map((player, index) => {
      const user = deduction.userMap.get(player.userId);

      return {
        user: player.userId,
        socketId: player.socketId,
        latestLanguage: "cpp",
        team: index < teamSize ? 1 : 2,
        coinContribution: entryCoins,
        balanceAfterEntry: user ? user.coinBalance : 0,
      };
    }),
    problem: problem._id,
  });

  const hydratedMatch = await Match.findById(match._id)
    .populate("problem")
    .populate("players.user", "username rating coinBalance");

  await setUsersActiveMatch(
    queuedPlayers.map((player) => player.userId),
    hydratedMatch._id,
    "lobby"
  );

  queuedPlayers.forEach(({ socketId }) => {
    const socket = io.sockets.sockets.get(socketId);
    if (socket) {
      socket.join(roomId);
    }
  });

  hydratedMatch.players.forEach((player) => {
    const socket = io.sockets.sockets.get(player.socketId);
    const teammates = hydratedMatch.players.filter(
      (entry) => entry.team === player.team && entry.user._id.toString() !== player.user._id.toString()
    );
    const opponents = hydratedMatch.players.filter((entry) => entry.team !== player.team);

    if (socket) {
      socket.emit("matchFound", {
        ...buildLobbyPayload(hydratedMatch),
        teammates: buildTeamPayload(teammates),
        opponents: buildTeamPayload(opponents),
      });

      socket.emit("lobbyUpdated", {
        ...buildLobbyPayload(hydratedMatch),
        currentPlayer: {
          id: player.user._id,
          username: player.user.username,
          rating: player.user.rating,
          coinBalance: player.balanceAfterEntry,
          team: player.team,
          coinContribution: player.coinContribution,
        },
        teammates: buildTeamPayload(teammates),
        opponents: buildTeamPayload(opponents),
      });
    }
  });

  logMatch("Match created", {
    matchId: hydratedMatch._id.toString(),
    mode: hydratedMatch.mode,
    teamSize: hydratedMatch.teamSize,
  });

  scheduleLobbyStart(io, hydratedMatch._id.toString());
  return hydratedMatch;
}

async function maybeCreateMatch(io) {
  for (const mode of getSupportedModes()) {
    const requiredPlayers = getRequiredPlayers(mode);

    while (getQueue(mode).length >= requiredPlayers) {
      const players = selectBalancedPlayers(mode);
      if (!players) {
        break;
      }

      await createMatch(io, players, mode);
      emitQueueUpdate(io, mode);
    }
  }
}

async function enqueuePlayer(io, player) {
  const mode = getSupportedModes().includes(player.mode) ? player.mode : "1v1";
  const queue = getQueue(mode);
  const existingEntry = Array.from(matchmakingQueues.entries()).find(([, entries]) =>
    entries.some((entry) => entry.userId === player.userId)
  );

  if (existingEntry) {
    const [existingMode, existingQueue] = existingEntry;
    const existing = existingQueue.find((entry) => entry.userId === player.userId);

    if (existingMode !== mode) {
      removeQueuedPlayer(player.userId);
      queue.push({ ...player, mode, joinedAt: new Date().toISOString() });
      emitQueueUpdate(io, existingMode);
      emitQueueUpdate(io, mode);
      await maybeCreateMatch(io);

      return {
        queued: true,
        ...getQueueSummary(mode),
        message: `You switched to the ${mode} queue`,
      };
    }

    existing.socketId = player.socketId;
    emitQueueUpdate(io, mode);

    return {
      queued: true,
      ...getQueueSummary(mode),
      message: `You are already in the ${mode} queue`,
    };
  }

  queue.push({ ...player, mode, joinedAt: new Date().toISOString() });
  emitQueueUpdate(io, mode);
  await maybeCreateMatch(io);

  return {
    queued: true,
    ...getQueueSummary(mode),
    message: `You have joined the ${mode} queue`,
  };
}

function removeQueuedPlayer(userId, mode) {
  const queues = mode ? [[mode, getQueue(mode)]] : Array.from(matchmakingQueues.entries());

  queues.forEach(([, queue]) => {
    const index = queue.findIndex((entry) => entry.userId === userId);

    if (index >= 0) {
      queue.splice(index, 1);
    }
  });
}

function getOtherTeam(team) {
  return team === 1 ? 2 : 1;
}

function buildMatchEndPayload(match, winningTeam, reason, rewardSummary = {}) {
  return {
    matchId: match._id.toString(),
    winnerId: match.winner ? match.winner.toString() : null,
    winnerTeam: winningTeam,
    endedAt: match.endedAt,
    status: match.status,
    prizePool: match.prizePool,
    rewardedUserIds: rewardSummary.rewardedUserIds || [],
    perWinnerReward: rewardSummary.perWinnerReward || 0,
    reason,
  };
}

function registerMatchmakingHandlers(io) {
  io.on("connection", (socket) => {
    connectedUsers.set(socket.user.id, socket.id);
    socket.join(`user:${socket.user.id}`);

    socket.on("joinQueue", async ({ mode } = {}) => {
      try {
        const result = await enqueuePlayer(io, {
          userId: socket.user.id,
          username: socket.user.username,
          rating: socket.user.rating,
          socketId: socket.id,
          mode,
        });

        socket.emit("queueJoined", result);
      } catch (error) {
        socket.emit("queueError", { message: error.message });
      }
    });

    socket.on("leaveQueue", ({ mode } = {}) => {
      removeQueuedPlayer(socket.user.id, mode);
      if (mode) {
        emitQueueUpdate(io, mode);
      } else {
        getSupportedModes().forEach((queueMode) => emitQueueUpdate(io, queueMode));
      }
      socket.emit("queueLeft", { success: true, ...getQueueSummary(mode || "1v1") });
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
      getSupportedModes().forEach((queueMode) => emitQueueUpdate(io, queueMode));

      const match = await Match.findOne({
        "players.socketId": socket.id,
        status: { $in: ["lobby", "active"] },
      }).populate("players.user", "username rating coinBalance");

      if (!match) {
        return;
      }

      const disconnectedPlayer = match.players.find((player) => player.socketId === socket.id);

      if (!disconnectedPlayer) {
        return;
      }

      disconnectedPlayer.status = "disconnected";

      if (match.status === "lobby") {
        if (lobbyTimers.has(match._id.toString())) {
          clearTimeout(lobbyTimers.get(match._id.toString()));
          lobbyTimers.delete(match._id.toString());
        }

        match.status = "cancelled";
        match.endedAt = new Date();
        await refundEntryCoins(match);
        await match.save();
        await clearUsersActiveMatch(match.players.map((player) => player.user._id.toString()));

        logWarn("MATCH", "Match cancelled (lobby disconnect)", { matchId: match._id.toString() });

        io.to(match.roomId).emit("matchCancelled", {
          matchId: match._id.toString(),
          reason: "A player left before the lobby countdown finished. Coins were refunded.",
        });
        return;
      }

      const winningTeam = getOtherTeam(disconnectedPlayer.team);
      match.status = "completed";
      match.winnerTeam = winningTeam;
      match.endedAt = new Date();

      match.players.forEach((player) => {
        if (player.team === winningTeam && player.status !== "disconnected") {
          player.status = "accepted";
        } else if (player.team !== winningTeam && player.status !== "disconnected") {
          player.status = "defeated";
        }
      });

      const winningPlayer = match.players.find((player) => player.team === winningTeam);

      if (winningPlayer) {
        match.winner = winningPlayer.user._id || winningPlayer.user;
      }

      const rewardSummary = await awardPrizePool(match, winningTeam);
      await match.save();
      await clearUsersActiveMatch(match.players.map((player) => player.user._id.toString()));

      logMatch("Match completed (disconnect)", {
        matchId: match._id.toString(),
        winnerTeam: winningTeam,
      });

      io.to(match.roomId).emit("matchEnd", buildMatchEndPayload(match, winningTeam, "Opponent disconnected", rewardSummary));
    });
  });
}

module.exports = {
  enqueuePlayer,
  getQueueSummary,
  getSupportedModes,
  registerMatchmakingHandlers,
  removeQueuedPlayer,
};
