const express = require("express");
const cors = require("cors");

const { runPython } = require("./runners/python");
const { runCpp } = require("./runners/cpp");
const { runJava } = require("./runners/java");
const { judge } = require("./judge/judge");
// const { runJS } = require("./runners/javascript");

const app = express();

app.use(cors());
app.use(express.json());

// 🔥 Get Runner
function getRunner(language) {
  if (language === "python") return runPython;
  if (language === "cpp") return runCpp;
  if (language === "java") return runJava;
  
  return null;
}

// 🔥 Normalize Input (FIX YOUR ERROR)
function normalizeInput(input) {
  if (typeof input === "object") {
    const nums = JSON.parse(input.nums).join(" ");
    const target = input.target;
    return `${nums}\n${target}`;
  }
  return input;
}

function wrapJava(code, input) {
  const nums = JSON.parse(input.nums).join(",");
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
    }
}
`;
}

function wrapCpp(code, input) {
  const nums = JSON.parse(input.nums).join(",");
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
  const nums = input.nums;
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
  const nums = input.nums;
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
  const { language, code, input } = req.body;
  console.log(req.body);
  

  const runner = getRunner(language);
  if (!runner) {
    return res.status(400).json({ error: "Unsupported language" });
  }

  try {
    // 🔥 Normalize input FIRST
    const normalizedInput = normalizeInput(input);

    let finalCode = code;

    // 🔥 Wrap code
    if (language === "java") {
      finalCode = wrapJava(code, input);
    } else if (language === "cpp") {
      finalCode = wrapCpp(code, input);
    } else if (language === "python") {
      finalCode = wrapPython(code, input);
    } else if (language === "javascript") {
      finalCode = wrapJS(code, input);
    }

    const result = await runner(finalCode, normalizedInput);

    return res.json({
      output: result.output || "",
      status: result.status
    });

  } catch (err) {
    console.log(err);
    return res.json({
      output: "",
      status: "Runtime Error"
    });
  }
});

//////////////////////////////////////////////////////////
// 🔥 SUBMIT API (JUDGE SYSTEM)
//////////////////////////////////////////////////////////

app.post("/api/submit", async (req, res) => {
  const { language, code } = req.body;
  console.log(req.body);


  const runner = getRunner(language);

  // 🔥 Problem definition
  const problem = {
    timeLimit: 3000,

    testcases: [
      {
        input: { nums: "[2,7,11,15]", target: "9" },
        output: "[0, 1]",
        hidden: false
      },
      {
        input: { nums: "[3,2,4]", target: "6" },
        output: "[1, 2]",
        hidden: false
      },
      {
        input: { nums: "[3,3]", target: "6" },
        output: "[0, 1]",
        hidden: true // 🔥 hidden testcase
      }
    ]
  };

  const result = await judge({
    code,
    language,
    testcases: problem.testcases,
    runner,
    timeLimit: problem.timeLimit
  });

  // 🔥 Hide hidden testcases
  const visibleResults = result.results.map((r, i) => ({
    ...r,
    input: problem.testcases[i].hidden ? "Hidden" : r.input
  }));

  res.json({
    status: result.status,
    failedCase: result.failedCase,
    results: visibleResults
  });
});
//////////////////////////////////////////////////////////

app.listen(5001, () => {
  console.log("🚀 Code Runner running on port 5001");
});