const redis = require("../../config/redis");
const matchService = require("./match.service");
const matchmaking = require("./matchmaking.service");
const { REDIS_KEYS } = require("./match.constants");

module.exports = (io) => {
  io.on("connection", (socket) => {
    const userId = socket.user.id;

    console.log("User connected:", userId);

    // ✅ JOIN ROOM
    socket.on("join_room", ({ matchId }) => {
      const room = `match_${matchId}`;
      socket.join(room);

      console.log(`✅ User ${userId} joined room ${room}`);
    });

    // ✅ JOIN QUEUE
    socket.on("join_queue", async () => {
      console.log("JOIN QUEUE:", userId);

      await matchmaking.addToQueue(userId, socket.id);

      const queueSize = await redis.llen(REDIS_KEYS.QUEUE_1V1);
      if (queueSize < 2) return;

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

      // 🔥 FIX: emit to individual sockets
      io.to(player1.socketId).emit("match_found", {
        matchId,
        players: [player1.userId, player2.userId],
      });

      io.to(player2.socketId).emit("match_found", {
        matchId,
        players: [player1.userId, player2.userId],
      });

      await matchService.startMatch(matchId);

      // ✅ START MATCH AFTER BOTH JOIN ROOM
      const room = `match_${matchId}`;

      setTimeout(() => {
        console.log("🚀 MATCH START EMITTED:", matchId);
        io.to(room).emit("match_start", { matchId });
      }, 2000);
    });

    // ❌ LEAVE QUEUE
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