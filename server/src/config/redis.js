const Redis = require("ioredis");

// Support both REDIS_URL (preferred) and individual connection parameters
const redisConfig = process.env.REDIS_URL
  ? process.env.REDIS_URL
  : {
      host: process.env.REDIS_HOST || "127.0.0.1",
      port: process.env.REDIS_PORT || 6379,
      db: process.env.REDIS_DB || 0,
    };

const redis = new Redis(redisConfig);

redis.on("connect", () => console.log("✅ Redis connected"));
redis.on("error", (e) => console.error("❌ Redis error", e));

module.exports = redis;
