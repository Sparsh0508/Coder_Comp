const redis = require("../../config/redis");
const matchService = require("./match.service");
const { REDIS_KEYS } = require("./match.constants");

module.exports = (io) => {
  io.on("connection", (socket) => {
    const userId = socket.user.id; // from auth middleware

    socket.on("join_queue", async () => {
      console.log("JOIN QUEUE:", userId);

      await redis.rpush(REDIS_KEYS.QUEUE_1V1, userId);

      const queueSize = await redis.llen(REDIS_KEYS.QUEUE_1V1);
      console.log("Queue size:", queueSize);

      if (queueSize >= 2) {
        const p1 = await redis.lpop(REDIS_KEYS.QUEUE_1V1);
        const p2 = await redis.lpop(REDIS_KEYS.QUEUE_1V1);

        if (!p1 || !p2 || p1 === p2) return;

        const matchId = await matchService.createMatch(p1, p2);

        const room = `match_${matchId}`;
        socket.join(room);

        io.to(room).emit("match_found", { matchId, p1, p2 });

        await matchService.startMatch(matchId);
        io.to(room).emit("match_start", { matchId });
      }
    });
  });
};
