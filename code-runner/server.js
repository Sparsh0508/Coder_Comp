const express = require("express");
const cors = require("cors");

const { runPython } = require("./runners/python");
const { runCpp } = require("./runners/cpp");
const { runJava } = require("./runners/java");
const { runJS } = require("./runners/javascript");
const { judge } = require("./judge/judge");

const app = express();

app.use(cors({
  origin: "https://coder-comp.vercel.app",
  credentials: true,
}));
app.use(express.json({ limit: process.env.JSON_BODY_LIMIT || "5mb" }));

//////////////////////////////////////////////////////////
// 🔥 Get Runner
//////////////////////////////////////////////////////////
function getRunner(language) {
  switch (language) {
    case "python":
      return runPython;
    case "cpp":
      return runCpp;
    case "java":
      return runJava;
    case "javascript":
      return runJS;
    default:
      return null;
  }
}

function normalizeTextInput(input) {
  if (input === undefined || input === null) return "";
  if (typeof input === "string") return input;
  return JSON.stringify(input);
}

//////////////////////////////////////////////////////////
// 🔥 Normalize Input (ONLY ONCE)
//////////////////////////////////////////////////////////
function normalizeInput(input) {
  if (typeof input === "object") {
    return {
      nums: JSON.parse(input.nums),
      target: Number(input.target),
    };
  }
  return input;
}

//////////////////////////////////////////////////////////
// 🔥 WRAPPERS (NO STDIN NEEDED)
//////////////////////////////////////////////////////////

function wrapJava(code, input) {
  const nums = input.nums.join(",");
  const target = input.target;

  return `
import java.util.*;

${code}

public class Main {
    public static void main(String[] args) {
        Solution sol = new Solution();

        int[] nums = new int[]{${nums}};
        int target = ${target};

        int[] res = sol.solve(nums, target);

        System.out.print("[");
        for (int i = 0; i < res.length; i++) {
            System.out.print(res[i]);
            if (i != res.length - 1) System.out.print(", ");
        }
        System.out.print("]");

        System.out.flush();   // ✅ IMPORTANT
        System.exit(0);       // ✅ FORCE EXIT
    }
}
`;
}
function wrapCpp(code, input) {
  const nums = input.nums.join(",");
  const target = input.target;

  return `
#include <bits/stdc++.h>
using namespace std;

${code}

int main() {
    vector<int> nums = {${nums}};
    int target = ${target};

    vector<int> res = solve(nums, target);

    cout << "[";
    for (int i = 0; i < res.size(); i++) {
        cout << res[i];
        if (i != res.size() - 1) cout << ", ";
    }
    cout << "]";
}
`;
}

function wrapPython(code, input) {
  const nums = JSON.stringify(input.nums);
  const target = input.target;

  return `
${code}

if __name__ == "__main__":
    nums = ${nums}
    target = ${target}
    print(solve(nums, target))
`;
}

function wrapJS(code, input) {
  const nums = JSON.stringify(input.nums);
  const target = input.target;

  return `
${code}

const nums = ${nums};
const target = ${target};

console.log(solve(nums, target));
`;
}

//////////////////////////////////////////////////////////
// 🔥 RUN API
//////////////////////////////////////////////////////////

app.post("/api/run", async (req, res) => {
  const { language, code, input, inputs } = req.body;

  console.log("===== RUN REQUEST =====");
  console.log(req.body);

  const runner = getRunner(language);

  if (!runner) {
    return res.status(400).json({
      error: "Unsupported language",
    });
  }

  try {
    if (Array.isArray(inputs)) {
      const results = await Promise.all(
        inputs.map(async (currInput, idx) => {
          const result = await runner(
            code,
            normalizeTextInput(currInput)
          );

          return {
            case: idx + 1,
            input: currInput,
            output: result.output || "",
            error: result.error || "",
            verdict:
              result.status === "Success"
                ? "Accepted"
                : result.status,
          };
        })
      );

      return res.json({
        status: "Success",
        results,
      });
    }

    const result = await runner(
      code,
      normalizeTextInput(input)
    );

    return res.json({
      status: result.status,
      output: result.output || "",
      error: result.error || "",
    });

  } catch (err) {
    console.error(err);

    return res.status(500).json({
      status: "Runtime Error",
      output: "",
      error: "Internal Server Error",
    });
  }
});

app.post("/api/execute", async (req, res) => {
  const { language, code, inputs } = req.body;
  console.log("===== EXECUTE REQUEST =====");
  console.log(req.body);

  const runner = getRunner(language);
  if (!runner) {
    return res.status(400).json({ error: "Unsupported language" });
  }

  try {
    const result = await runner(code, normalizeTextInput(stdin));
    console.log("Success in Execute")
    return res.json({
      status: result.status,
      output: result.output || result.stdout || "",
      error: result.error || result.stderr || "",
      time: result.time || 0,
      memory: 0,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      status: "Internal Error",
      output: "",
      error: "Internal Server Error",
      time: 0,
      memory: 0,
    });
  }
});

//////////////////////////////////////////////////////////
// 🔥 SUBMIT API (JUDGE SYSTEM)
//////////////////////////////////////////////////////////

app.post("/api/submit", async (req, res) => {
  const { language, code } = req.body;
  console.log("===== SUBMIT REQUEST =====");
  console.log(req.body);
  const runner = getRunner(language);

  const problem = {
    timeLimit: 3000,
    testcases: [
      {
        input: { nums: "[2,7,11,15]", target: "9" },
        output: "[0, 1]",
        hidden: false,
      },
      {
        input: { nums: "[3,2,4]", target: "6" },
        output: "[1, 2]",
        hidden: false,
      },
      {
        input: { nums: "[3,3]", target: "6" },
        output: "[0, 1]",
        hidden: true,
      },
    ],
  };

  try {
    const result = await judge({
      code,
      language,
      testcases: problem.testcases,
      runner,
      timeLimit: problem.timeLimit,
    });

    const visibleResults = result.results.map((r, i) => ({
      ...r,
      input: problem.testcases[i].hidden ? "Hidden" : r.input,
    }));

    res.json({
      status: result.status,
      failedCase: result.failedCase,
      results: visibleResults,
    });

  } catch (err) {
    console.error(err);
    res.json({
      status: "Error",
      results: [],
    });
  }
});

//////////////////////////////////////////////////////////

app.use((err, _req, res, next) => {
  if (err?.type === "entity.too.large") {
    return res.status(413).json({
      status: "Payload Too Large",
      error: `Request body exceeds ${process.env.JSON_BODY_LIMIT || "5mb"}`,
    });
  }

  return next(err);
});

const PORT = process.env.PORT || 10000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Code Runner running on port ${PORT}`);
});