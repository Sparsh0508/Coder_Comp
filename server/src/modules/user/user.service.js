const db = require('../../config/db');
const createUser= async({username, email,passwordHash})=>{
  const [result]=await db.query(
    `INSERT INTO users(username,email,passwordHash) value(?,?,?) `,
    [username,email,passwordHash]
  )
  return result.insertId;
}
const findUserByEmail = async(email)=>{
  const[row]= await db.query(
    `SELECT * FROM users where email =?`,
    [email]
  )
  return row[0];
}
const findUserById = async(id)=>{
  const [row]= await db.query(
    `SELECT * FROM users where email = id`,
    [id]
  )
  return row[0];
}
module.exports = {
  createUser,
  findUserByEmail
  ,findUserById
}