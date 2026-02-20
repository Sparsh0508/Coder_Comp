// testMatchService.js
const matchService = require("./src/modules/match/match.service");

(async () => {
  const matchId = await matchService.createMatch(1, 2);
  console.log("Match created:", matchId);

  await matchService.startMatch(matchId);
  console.log("Match started");

  await matchService.finishMatch(matchId, 1);
  console.log("Match finished");
})();
