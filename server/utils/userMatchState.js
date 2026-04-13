const User = require("../models/User");

async function setUsersActiveMatch(userIds, matchId, status) {
  if (!userIds.length) {
    return;
  }

  await User.updateMany(
    { _id: { $in: userIds } },
    {
      $set: {
        activeMatchId: matchId,
        activeMatchStatus: status,
      },
    }
  );
}

async function clearUsersActiveMatch(userIds) {
  if (!userIds.length) {
    return;
  }

  await User.updateMany(
    { _id: { $in: userIds } },
    {
      $set: {
        activeMatchId: null,
        activeMatchStatus: "available",
      },
    }
  );
}

module.exports = {
  clearUsersActiveMatch,
  setUsersActiveMatch,
};
