const Match = require("../models/Match");
const { awardPrizePool } = require("./matchEconomy");
const { clearUsersActiveMatch } = require("./userMatchState");

function getOtherTeam(team) {
  return team === 1 ? 2 : 1;
}

function buildMatchEndPayload(match, winningTeam, reason, rewardSummary = {}) {
  return {
    matchId: match._id.toString(),
    winnerId: match.winner ? match.winner.toString() : null,
    winnerTeam: winningTeam,
    endedAt: match.endedAt,
    status: match.status,
    prizePool: match.prizePool,
    rewardedUserIds: rewardSummary.rewardedUserIds || [],
    perWinnerReward: rewardSummary.perWinnerReward || 0,
    reason,
  };
}

async function forfeitMatchByUser({ io, matchId, userId, reason }) {
  if (!matchId) {
    return null;
  }

  const match = await Match.findById(matchId).populate("players.user", "username rating coinBalance");

  if (!match || !["lobby", "active"].includes(match.status)) {
    return null;
  }

  const player = match.players.find(
    (entry) => (entry.user?._id || entry.user).toString() === userId
  );

  if (!player) {
    return null;
  }

  player.status = "disconnected";

  const winningTeam = getOtherTeam(player.team);
  match.status = "completed";
  match.winnerTeam = winningTeam;
  match.endedAt = new Date();

  match.players.forEach((entry) => {
    if (entry.team === winningTeam && entry.status !== "disconnected") {
      entry.status = "accepted";
    } else if (entry.team !== winningTeam && entry.status !== "disconnected") {
      entry.status = "defeated";
    }
  });

  const winningPlayer = match.players.find((entry) => entry.team === winningTeam);
  if (winningPlayer) {
    match.winner = winningPlayer.user._id || winningPlayer.user;
  }

  const rewardSummary = await awardPrizePool(match, winningTeam);
  await match.save();
  await clearUsersActiveMatch(match.players.map((entry) => entry.user._id.toString()));

  if (io) {
    io.to(match.roomId).emit("matchEnd", buildMatchEndPayload(match, winningTeam, reason, rewardSummary));
  }

  return { match, rewardSummary };
}

module.exports = {
  forfeitMatchByUser,
};
