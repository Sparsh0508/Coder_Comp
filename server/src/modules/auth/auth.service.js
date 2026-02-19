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
const findUserByEmail = async (email) => {
  const [row] = await db.query(
    `SELECT * FROM USERS WHERE email = ?`,
    [email]
  )
  return row[0];
}

module.exports = {
  findUserByEmailOrUsername,
  createUser,
  findUserByEmail
};
