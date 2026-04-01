const redis = require("../../config/redis");
const matchService = require("./match.service");
const matchmaking = require("./matchmaking.service");
const { REDIS_KEYS } = require("./match.constants");

module.exports = (io) => {
  io.on("connection", (socket) => {
    const userId = socket.user.id;

    console.log("User connected:", userId);

    socket.on("join_queue", async () => {
  console.log("JOIN QUEUE:", userId);

  await matchmaking.addToQueue(userId, socket.id);

  // 🔥 ALWAYS check queue size
  const queueSize = await redis.llen(REDIS_KEYS.QUEUE_1V1);

  if (queueSize < 2) {
    // wait for opponent
    return;
  }

  // 🔒 LOCK (only for matching part)
  const lock = await redis.set(
    REDIS_KEYS.MATCH_LOCK,
    "1",
    "NX",
    "EX",
    2
  );

  if (!lock) return;

  const players = await matchmaking.popPlayers();
  if (!players) return;

  const { player1, player2 } = players;

  console.log("🔥 MATCHING:", player1.userId, player2.userId);

  const matchId = await matchService.createMatch(
    player1.userId,
    player2.userId
  );

  const room = `match_${matchId}`;

  io.sockets.sockets.get(player1.socketId)?.join(room);
  io.sockets.sockets.get(player2.socketId)?.join(room);

  io.to(room).emit("match_found", {
    matchId,
    players: [player1.userId, player2.userId],
  });

  await matchService.startMatch(matchId);

  io.to(room).emit("match_start", { matchId });
});

    socket.on("leave_queue", async () => {
      const queue = await redis.lrange(REDIS_KEYS.QUEUE_1V1, 0, -1);

      const filtered = queue.filter(
        (u) => JSON.parse(u).userId !== userId
      );

      await redis.del(REDIS_KEYS.QUEUE_1V1);

      if (filtered.length) {
        await redis.rpush(REDIS_KEYS.QUEUE_1V1, ...filtered);
      }
    });

    socket.on("disconnect", () => {
      console.log("Disconnected:", userId);
    });
  });
};