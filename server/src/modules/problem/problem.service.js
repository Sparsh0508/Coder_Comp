const db = require("../../config/db");

const getProblemById = async (id) => {
  const [rows] = await db.query("SELECT * FROM problems WHERE id = ?", [id]);
  return rows[0];
};

const getAllProblems = async () => {
  const [rows] = await db.query("SELECT * FROM problems");
  return rows;
};

module.exports = {
  getProblemById,
  getAllProblems
};
