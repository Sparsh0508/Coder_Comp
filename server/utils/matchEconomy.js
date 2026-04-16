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


  await User.updateMany(
    { _id: { $in: userIds } },
    {
      $inc: { coinBalance: -entryCoins },
      $push: {
        walletTransactions: {
          $each: [
            {
              type: "match_entry",
              rupeesAmount: 0,
              coinsAmount: entryCoins,
              status: "completed",
              note: `Arena entry locked ${entryCoins} coins`,
            },
          ],
          $position: 0,
        },
      },
    }
  );

  users.forEach((user) => {
    user.coinBalance -= entryCoins;
  });

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
    winnerUsers.map(async (user) => {
      const reward = baseReward + (remainder > 0 ? 1 : 0);
      remainder = Math.max(0, remainder - 1);
      await User.updateOne(
        { _id: user._id },
        {
          $inc: { coinBalance: reward },
          $push: {
            walletTransactions: {
              $each: [
                {
                  type: "match_reward",
                  rupeesAmount: 0,
                  coinsAmount: reward,
                  status: "completed",
                  note: "Prize pool reward",
                },
              ],
              $position: 0,
            },
          },
        }
      );
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
    users.map(async (user) => {
      const amount = refundMap.get(user._id.toString()) || 0;
      if (!amount) {
        return;
      }

      await User.updateOne(
        { _id: user._id },
        {
          $inc: { coinBalance: amount },
          $push: {
            walletTransactions: {
              $each: [
                {
                  type: "refund",
                  rupeesAmount: 0,
                  coinsAmount: amount,
                  status: "completed",
                  note: "Match entry refund",
                },
              ],
              $position: 0,
            },
          },
        }
      );
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
