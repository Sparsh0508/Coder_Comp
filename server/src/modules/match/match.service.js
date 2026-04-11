const db = require("../../config/db");

const createMatch = async (p1, p2, problemId = null) => {
  const [res] = await db.query(
    `INSERT INTO matches (player1_id, player2_id, problem_id)
     VALUES (?, ?, ?)`,
    [p1, p2, problemId]
  );
  return res.insertId;
};

const startMatch = async (matchId) => {
  await db.query(
    `UPDATE matches
     SET status = 'ACTIVE', started_at = NOW()
     WHERE id = ? AND status = 'WAITING'`,
    [matchId]
  );
};

const finishMatch = async (matchId, winnerId) => {
  await db.query(
    `UPDATE matches
     SET status = 'FINISHED',
         winner_id = ?,
         ended_at = NOW()
     WHERE id = ? AND status = 'ACTIVE'`,
    [winnerId, matchId]
  );
};

const getMatchById = async (matchId) => {
  const [rows] = await db.query(`SELECT * FROM matches WHERE id = ?`, [matchId]);
  return rows[0];
};
async function setWinner(matchId, userId) {
  await db.query(
    "UPDATE matches SET winner_id = ?, status = 'FINISHED' WHERE id = ?",
    [userId, matchId]
  );
}

async function getMatch(matchId) {
  const [rows] = await db.query(
    "SELECT * FROM matches WHERE id = ?",
    [matchId]
  );
  return rows[0];
}

module.exports = {
  createMatch,
  startMatch,
  finishMatch,
  getMatchById,
  setWinner,
  getMatch
};
