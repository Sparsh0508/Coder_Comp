const COINS_PER_10_RUPEES = 100;
const RUPEES_PER_100_COINS = 10;
const MIN_WITHDRAW_COINS = 100;

function rupeesToCoins(rupees) {
  return Math.round((Number(rupees) / RUPEES_PER_100_COINS) * COINS_PER_10_RUPEES);
}

function coinsToRupees(coins) {
  return Number(((Number(coins) / COINS_PER_10_RUPEES) * RUPEES_PER_100_COINS).toFixed(2));
}

module.exports = {
  COINS_PER_10_RUPEES,
  MIN_WITHDRAW_COINS,
  RUPEES_PER_100_COINS,
  coinsToRupees,
  rupeesToCoins,
};
