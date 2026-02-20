const matchService = require("./match.service");

exports.getMatchById = async (req, res) => {
  const match = await matchService.getMatchById(req.params.id);
  if (!match) return res.status(404).json({ message: "Match not found" });
  res.json(match);
};
