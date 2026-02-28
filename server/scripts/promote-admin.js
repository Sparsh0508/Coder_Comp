require('dotenv').config();
const db = require("../src/config/db");

const promoteUser = async (identifier) => {
    try {
        const [result] = await db.query(
            "UPDATE users SET role = 'admin' WHERE username = ? OR email = ?",
            [identifier, identifier]
        );
        if (result.affectedRows === 0) {
            console.log(`User ${identifier} not found.`);
        } else {
            console.log(`User ${identifier} promoted to admin.`);
        }
        process.exit(0);
    } catch (err) {
        console.error("Error promoting user:", err);
        process.exit(1);
    }
};

const username = process.argv[2];
if (!username) {
    console.log("Please provide a username: node promote-admin.js <username>");
    process.exit(1);
}

promoteUser(username);
