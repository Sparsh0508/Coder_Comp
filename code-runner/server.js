  const express = require("express");
  const cors = require("cors");

  const { runPython } = require("./runners/python");
  const { runCpp } = require("./runners/cpp");
  const { runJava } = require("./runners/java");

  const app = express();

  app.use(cors());
  app.use(express.json());

  // const problems = {
  //   sum: {
  //     timeLimit: 2000,
  //     testCases: [
  //       { input: "2 3", output: "5" },
  //       { input: "10 20", output: "30" },
  //       { input: "100 200", output: "300" }
  //     ]
  //   }
  // };

  function getRunner(language) {
    if (language === "python") return runPython;
    if (language === "cpp") return runCpp;
    if (language === "java") return runJava;
    return null;
  }

  function runWithTimeout(promise, ms) {
    return Promise.race([
      promise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("TLE")), ms)
      )
    ]);
  }

  app.post("/api/run", async (req, res) => {
  console.log("REQ BODY:", req.body); // 👈 ADD THIS

  const { language, code, input } = req.body;

  const runner = getRunner(language);
  if (!runner) {
    return res.status(400).json({ error: "Unsupported language" });
  }

  try {
    const result = await runner(code, input);

    console.log("RESULT:", result); // 👈 ADD THIS

    return res.json({
      output: result.output || "",
      status: result.status
    });

  } catch (err) {
    console.log("ERROR:", err);
    return res.json({
      output: "",
      status: "Runtime Error"
    });
  }
});

  app.post("/api/submit", async (req, res) => {
    const { language, code } = req.body;

    const runner = getRunner(language);

    if (!runner) {
      return res.status(400).json({ error: "Unsupported language" });
    }

    
    const problem = {
      timeLimit: 3000,
      testCases: [
        { input: "2 7 11 15\n9", output: "[0, 1]" },
        { input: "3 2 4\n6", output: "[1, 2]" },
        { input: "3 3\n6", output: "[0, 1]" }
      ]
    };

    for (let i = 0; i < problem.testCases.length; i++) {
      const test = problem.testCases[i];

      try {
        const result = await Promise.race([
          runner(code, test.input),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("TLE")), problem.timeLimit)
          )
        ]);

        
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
          status: err.message === "TLE" ? "Time Limit Exceeded" : "Runtime Error",
          failedCase: i + 1
        });
      }
    }

    return res.json({
      status: "Accepted"
    });
  });


  app.listen(5001, () => {
    console.log("Code Runner running on port 5001");
  });