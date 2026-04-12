const SUPPORTED_TEAM_SIZES = {
  "1v1": 1,
  "2v2": 2,
  "4v4": 4,
};

const ENTRY_COINS_BY_MODE = {
  "1v1": 50,
  "2v2": 75,
  "4v4": 100,
};

const LOBBY_DURATION_MS = 8000;
const MATCH_DURATION_MS = 30 * 60 * 1000;

function getSupportedModes() {
  return Object.keys(SUPPORTED_TEAM_SIZES);
}

function getTeamSize(mode = "1v1") {
  return SUPPORTED_TEAM_SIZES[mode] || SUPPORTED_TEAM_SIZES["1v1"];
}

function getRequiredPlayers(mode = "1v1") {
  return getTeamSize(mode) * 2;
}

function getEntryCoins(mode = "1v1") {
  return ENTRY_COINS_BY_MODE[mode] || ENTRY_COINS_BY_MODE["1v1"];
}

module.exports = {
  ENTRY_COINS_BY_MODE,
  LOBBY_DURATION_MS,
  MATCH_DURATION_MS,
  SUPPORTED_TEAM_SIZES,
  getEntryCoins,
  getRequiredPlayers,
  getSupportedModes,
  getTeamSize,
};
