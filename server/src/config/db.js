const mySQL = require('mysql2')
const pool = mySQL.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
})
pool.getConnection((err, connection) => {
  if (err) {
    console.error(" Database connection failed:", err.message);
  } else {
    console.log(" MySQL Connected Successfully");
    connection.release();
  }
})

module.exports = pool.promise();