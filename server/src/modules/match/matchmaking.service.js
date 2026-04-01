const redis = require("../../config/redis");
const { REDIS_KEYS } = require("./match.constants");

const addToQueue = async (userId, socketId) => {
  const data = JSON.stringify({ userId, socketId });

  // Prevent duplicate entry
  const queue = await redis.lrange(REDIS_KEYS.QUEUE_1V1, 0, -1);
  const exists = queue.find(
    (u) => JSON.parse(u).userId === userId
  );
  if (exists) return;

  await redis.rpush(REDIS_KEYS.QUEUE_1V1, data);
};

const popPlayers = async () => {
  const p1 = await redis.lpop(REDIS_KEYS.QUEUE_1V1);
  const p2 = await redis.lpop(REDIS_KEYS.QUEUE_1V1);

  if (!p1 || !p2) return null;

  const player1 = JSON.parse(p1);
  const player2 = JSON.parse(p2);

  if (player1.userId === player2.userId) return null;

  return { player1, player2 };
};

module.exports = {
  addToQueue,
  popPlayers
};