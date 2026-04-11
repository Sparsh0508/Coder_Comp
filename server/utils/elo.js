function calculateExpectedScore(playerRating, opponentRating) {
  return 1 / (1 + 10 ** ((opponentRating - playerRating) / 400));
}

function calculateElo(winnerRating, loserRating, kFactor = 24) {
  const winnerExpected = calculateExpectedScore(winnerRating, loserRating);
  const loserExpected = calculateExpectedScore(loserRating, winnerRating);

  return {
    winnerRating: Math.round(winnerRating + kFactor * (1 - winnerExpected)),
    loserRating: Math.round(loserRating + kFactor * (0 - loserExpected)),
  };
}

module.exports = {
  calculateElo,
};
