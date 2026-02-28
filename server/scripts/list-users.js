require('dotenv').config();
const db = require("../src/config/db");

const listUsers = async () => {
    try {
        const [rows] = await db.query("SELECT id, username, email, role FROM users");
        console.log("Current Users in DB:");
        console.table(rows);
        process.exit(0);
    } catch (err) {
        console.error("Error listing users:", err);
        process.exit(1);
    }
};

listUsers();
