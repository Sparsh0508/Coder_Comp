module.exports = {
  MATCH_STATUS: {
    WAITING: "WAITING",
    ACTIVE: "ACTIVE",
    FINISHED: "FINISHED",
    CANCELLED: "CANCELLED"
  },

  REDIS_KEYS: {
    QUEUE_1V1: "match_queue_1v1",
    USER_LOCK: (id) => `match_lock_${id}`
  }
};
