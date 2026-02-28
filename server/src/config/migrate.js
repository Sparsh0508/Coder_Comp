const fs = require("fs");
const path = require("path");
const db = require("./db");

const runMigrations = async () => {
  try {
    const migrationsPath = path.join(__dirname, "../../migrations");
    const files = fs.readdirSync(migrationsPath);

    for (const file of files) {
      try {
        const sql = fs.readFileSync(
          path.join(migrationsPath, file),
          "utf8"
        );
        await db.query(sql);
        console.log(`Migration executed: ${file}`);
      } catch (err) {
        if (err.code === 'ER_DUP_FIELDNAME' || err.code === 'ER_TABLE_EXISTS_ERROR') {
          console.log(`Migration already applied (skipped): ${file}`);
        } else {
          console.error(`Error executing migration ${file}:`, err.message);
        }
      }
    }

  } catch (err) {
    console.error(" Migration failed:", err);
  }
};

module.exports = runMigrations;
