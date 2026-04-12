const User = require("../models/User");

async function deductEntryCoins(userIds, entryCoins) {
  const users = await User.find({ _id: { $in: userIds } });
  const userMap = new Map(users.map((user) => [user._id.toString(), user]));
  const insufficientUsers = users.filter((user) => user.coinBalance < entryCoins);

  if (insufficientUsers.length) {
    return {
      success: false,
      insufficientUserIds: insufficientUsers.map((user) => user._id.toString()),
      userMap,
    };
  }

  await Promise.all(
    users.map((user) => {
      user.coinBalance -= entryCoins;
      user.walletTransactions.unshift({
        type: "match_entry",
        rupeesAmount: 0,
        coinsAmount: entryCoins,
        status: "completed",
        note: `Arena entry locked ${entryCoins} coins`,
      });
      return user.save();
    })
  );

  return {
    success: true,
    userMap,
  };
}

async function awardPrizePool(match, winningTeam) {
  if (match.prizeDistributed || !match.prizePool) {
    return { rewardedUserIds: [], perWinnerReward: 0, totalPrizePool: match.prizePool || 0 };
  }

  const winners = match.players.filter((player) => player.team === winningTeam);

  if (!winners.length) {
    return { rewardedUserIds: [], perWinnerReward: 0, totalPrizePool: match.prizePool || 0 };
  }

  const winnerUsers = await User.find({ _id: { $in: winners.map((player) => player.user._id || player.user) } });
  const baseReward = Math.floor(match.prizePool / winnerUsers.length);
  let remainder = match.prizePool % winnerUsers.length;

  await Promise.all(
    winnerUsers.map((user) => {
      const reward = baseReward + (remainder > 0 ? 1 : 0);
      remainder = Math.max(0, remainder - 1);
      user.coinBalance += reward;
      user.walletTransactions.unshift({
        type: "match_reward",
        rupeesAmount: 0,
        coinsAmount: reward,
        status: "completed",
        note: "Prize pool reward",
      });
      return user.save();
    })
  );

  match.prizeDistributed = true;

  return {
    rewardedUserIds: winnerUsers.map((user) => user._id.toString()),
    perWinnerReward: baseReward,
    totalPrizePool: match.prizePool,
  };
}

async function refundEntryCoins(match) {
  if (match.prizeDistributed) {
    return { refundedUserIds: [] };
  }

  const refunds = match.players.map((player) => ({
    userId: (player.user._id || player.user).toString(),
    amount: player.coinContribution || 0,
  }));
  const users = await User.find({ _id: { $in: refunds.map((refund) => refund.userId) } });
  const refundMap = new Map(refunds.map((refund) => [refund.userId, refund.amount]));

  await Promise.all(
    users.map((user) => {
      user.coinBalance += refundMap.get(user._id.toString()) || 0;
      user.walletTransactions.unshift({
        type: "refund",
        rupeesAmount: 0,
        coinsAmount: refundMap.get(user._id.toString()) || 0,
        status: "completed",
        note: "Lobby cancelled refund",
      });
      return user.save();
    })
  );

  match.prizeDistributed = true;

  return {
    refundedUserIds: users.map((user) => user._id.toString()),
  };
}

module.exports = {
  awardPrizePool,
  deductEntryCoins,
  refundEntryCoins,
};
