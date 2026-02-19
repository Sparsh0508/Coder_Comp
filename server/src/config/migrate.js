const fs = require("fs");
const path = require("path");
const db = require("./db");

const runMigrations = async () => {
  try {
    const migrationsPath = path.join(__dirname, "../../migrations");
    const files = fs.readdirSync(migrationsPath);

    for (const file of files) {
      const sql = fs.readFileSync(
        path.join(migrationsPath, file),
        "utf8"
      );

      await db.query(sql);
      console.log(`Migration executed: ${file}`);
    }

  } catch (err) {
    console.error(" Migration failed:", err);
  }
};

module.exports = runMigrations;
