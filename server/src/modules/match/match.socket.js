const redis = require("../../config/redis");
const matchService = require("./match.service");
const matchmaking = require("./matchmaking.service");

const { REDIS_KEYS } = require("./match.constants");
const db = require("../../config/db");

module.exports = (io) => {
  io.on("connection", (socket) => {
    const userId = socket.user.id;

    console.log("User connected:", userId);

    socket.on("join_room", ({ matchId }) => {
      const room = `match_${matchId}`;
      socket.join(room);

      console.log(` User ${userId} joined room ${room}`);
    });

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
      console.log(players);
      
      
      if (!players) return;
      
      const { player1, player2 } = players;
      const user1 = await db.query("SELECT username FROM users WHERE id = ?", [player1.userId]);
      const user2 = await db.query("SELECT username FROM users WHERE id = ?", [player2.userId]);
      console.log(user1);
      console.log(user2);

      console.log("🔥 MATCHING:", player1.userId, player2.userId);

      // ✅ Pick a random problem (or hardcode for now if problems table is not stable)
      let problemId = 1; // Default
      try {
        const [probs] = await db.query("SELECT id FROM problems ORDER BY RAND() LIMIT 1");
        if (probs && probs.length > 0) problemId = probs[0].id;
      } catch (err) {
        console.error("No problems found, defaulting to 1");
      }

      const matchId = await matchService.createMatch(
        player1.userId,
        player2.userId,
        problemId
      );

    console.log("Sending usernames:", user1[0][0].username, user2[0][0].username);
      io.to(player1.socketId).emit("match_found", {
        matchId,
        players: [player1.userId, player2.userId],
        playersNames:[user1[0][0].username, user2[0][0].username],
        problemId: problemId
      });

      io.to(player2.socketId).emit("match_found", {
        matchId,
        players: [player2.userId, player1.userId],
        playersNames:[user2[0][0].username,user1[0][0].username],
        problemId: problemId
      });

      await matchService.startMatch(matchId);

     
      const room = `match_${matchId}`;

      setTimeout(() => {
        console.log("🚀 MATCH START EMITTED:", matchId);
        io.to(room).emit("match_start", { matchId });
      }, 2000);
    });

    socket.on("submit_success", async ({ matchId, userId }) => {
      const room = `match_${matchId}`;

      console.log(" Submission success from:", userId);

      const match = await matchService.getMatch(matchId);

    
      if (match.winner) return;

     
      await matchService.setWinner(matchId, userId);

      console.log("🏆 WINNER:", userId);

     
      io.to(room).emit("match_result", {
        winner: userId
      });
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