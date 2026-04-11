const User = require("../models/User");

async function getLeaderboard(_req, res, next) {
  try {
    const users = await User.find()
      .select("username rating wins losses totalMatches createdAt")
      .sort({ rating: -1, wins: -1, createdAt: 1 })
      .limit(50);

    return res.status(200).json({
      success: true,
      leaderboard: users.map((user, index) => ({
        rank: index + 1,
        id: user._id,
        username: user.username,
        rating: user.rating,
        wins: user.wins,
        losses: user.losses,
        totalMatches: user.totalMatches,
      })),
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getLeaderboard,
};
