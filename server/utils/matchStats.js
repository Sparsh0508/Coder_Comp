const Match = require("../models/Match");
const User = require("../models/User");
const { calculateElo } = require("./elo");

function getPlayerUserId(player) {
  return (player.user?._id || player.user).toString();
}

async function applyMatchStatsOnce(match, winningTeam) {
  if (!winningTeam) {
    return { applied: false };
  }

  const claimed = await Match.findOneAndUpdate(
    { _id: match._id, statsApplied: { $ne: true } },
    { $set: { statsApplied: true } },
    { new: true }
  );

  if (!claimed) {
    return { applied: false };
  }

  match.statsApplied = true;

  const winners = match.players.filter((player) => player.team === winningTeam);
  const losers = match.players.filter((player) => player.team !== winningTeam);

  if (!winners.length || !losers.length) {
    return { applied: true };
  }

  const winnerUsers = await User.find({ _id: { $in: winners.map(getPlayerUserId) } });
  const loserUsers = await User.find({ _id: { $in: losers.map(getPlayerUserId) } });

  if (!winnerUsers.length || !loserUsers.length) {
    return { applied: true };
  }

  const averageWinnerRating = winnerUsers.reduce((sum, user) => sum + user.rating, 0) / winnerUsers.length;
  const averageLoserRating = loserUsers.reduce((sum, user) => sum + user.rating, 0) / loserUsers.length;
  const { winnerRating, loserRating } = calculateElo(averageWinnerRating, averageLoserRating);
  const winnerDelta = winnerRating - Math.round(averageWinnerRating);
  const loserDelta = loserRating - Math.round(averageLoserRating);

  await Promise.all([
    User.updateMany(
      { _id: { $in: winnerUsers.map((user) => user._id) } },
      { $inc: { rating: winnerDelta, wins: 1, totalMatches: 1 } }
    ),
    User.updateMany(
      { _id: { $in: loserUsers.map((user) => user._id) } },
      { $inc: { rating: loserDelta, losses: 1, totalMatches: 1 } }
    ),
  ]);

  return { applied: true };
}

module.exports = {
  applyMatchStatsOnce,
};
