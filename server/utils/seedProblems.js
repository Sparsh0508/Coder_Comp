require("dotenv").config();

const connectDb = require("./connectDb");
const Problem = require("../models/Problem");
const problemTemplates = require("./problemTemplates");

async function seedProblems() {
  await connectDb();
  await Problem.deleteMany({});
  await Problem.insertMany(problemTemplates);
  console.log(`Seeded ${problemTemplates.length} problems`);
  process.exit(0);
}

seedProblems().catch((error) => {
  console.error("Failed to seed problems", error);
  process.exit(1);
});
