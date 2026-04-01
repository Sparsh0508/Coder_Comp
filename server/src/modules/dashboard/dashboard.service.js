const db = require("../../config/db.js")
const getDashboardData = async (userId) => {
  const [[user]] = await db.query(
    `Select id,username,rating from users where id = ?`, [userId]
  )
  const [[stats]] = await db.query(
    `Select COUNT(*) as total, SUM(CASE WHEN winner_id = ? THEN 1 ELSE 0 END) as wins
    FROM matches
    WHERE player1_id= ? OR player2_id=?`,
    [userId, userId, userId]
  )

  const total = stats.total || 0;
  const wins = stats.wins || 0;
  const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;

  const [matches] = await db.query(
    `SELECT 
        m.id,
        CASE 
          WHEN m.player1_id = ? THEN u2.username
          ELSE u1.username
        END as opponent,
        CASE 
          WHEN m.winner_id = ? THEN 'WIN'
          ELSE 'LOSS'
        END as result
     FROM matches m
     JOIN users u1 ON m.player1_id = u1.id
     JOIN users u2 ON m.player2_id = u2.id
     WHERE m.player1_id = ? OR m.player2_id = ?
     ORDER BY m.created_at DESC
     LIMIT 5`,
    [userId, userId, userId, userId]
  );


  const [leaderboard] = await db.query(
    `SELECT id, username, rating
     FROM users
     ORDER BY rating DESC
     LIMIT 5`
  );

  return {
    user,
    stats: {
      total,
      wins,
      winRate,
      streak: 0,
    },
    recentMatches: matches,
    leaderboard,
  };
}
module.exports = {
  getDashboardData,
};