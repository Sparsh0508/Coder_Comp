const db = require("../../config/db");

const findUserByEmailOrUsername = async (email, username) => {
  const [rows] = await db.query(
    `SELECT id FROM users WHERE email = ? OR username = ?`,
    [email, username]
  );
  return rows[0];
};

const createUser = async (username, email, passwordHash) => {
  const [result] = await db.query(
    `INSERT INTO users (username, email, password_hash)
     VALUES (?, ?, ?)`,
    [username, email, passwordHash]
  );

  return result.insertId;
};

module.exports = {
  findUserByEmailOrUsername,
  createUser,
};
