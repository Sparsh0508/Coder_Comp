const express = require("express");
const { runPython } = require("./runners/python");
const { runCpp } = require("./runners/cpp");
const { runJava } = require("./runners/java");

const app = express();
app.use(express.json());

const problems = {
  sum: {
    timeLimit: 2000, 
    testCases: [
      { input: "2 3", output: "5" },
      { input: "10 20", output: "30" },
      { input: "100 200", output: "300" }
    ]
  }
};

function getRunner(language) {
  if (language === "python") return runPython;
  if (language === "cpp") return runCpp;
  if (language === "java") return runJava;
  return null;
}

app.post("/run", async (req, res) => {
  const { language, code, input } = req.body;

  const runner = getRunner(language);
  if (!runner) {
    return res.status(400).json({ error: "Unsupported language" });
  }

  try {
    const result = await runner(code, input);
    return res.json(result);
  } catch (error) {
    return res.status(500).json({
      status: "Internal Error",
      error: error.message
    });
  }
});


app.post("/submit", async (req, res) => {
  const { language, code, problemId } = req.body;

  const problem = problems[problemId];
  if (!problem) {
    return res.status(404).json({ error: "Problem not found" });
  }

  const runner = getRunner(language);
  if (!runner) {
    return res.status(400).json({ error: "Unsupported language" });
  }

  for (let i = 0; i < problem.testCases.length; i++) {
    const test = problem.testCases[i];

    try {
      const result = await runner(code, test.input);

      
      if (result.status !== "Success") {
        return res.json({
          status: result.status,
          failedCase: i + 1
        });
      }

     
      if (result.output.trim() !== test.output.trim()) {
        return res.json({
          status: "Wrong Answer",
          failedCase: i + 1,
          expected: test.output,
          got: result.output
        });
      }

    } catch (err) {
      return res.json({
        status: "Runtime Error",
        failedCase: i + 1
      });
    }
  }

  return res.json({ status: "Accepted" });
});


app.listen(5001, () => {
  console.log("Code Runner running on port 5001");
});
