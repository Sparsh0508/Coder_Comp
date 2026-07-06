const { wrapJava, wrapCpp, wrapPython, wrapJS } = require("./wrappers");

// SAFE INPUT NORMALIZER
function normalizeInput(input) {
  if (!input) return "";

  if (typeof input === "object") {
    try {
      const nums = Array.isArray(input.nums)
        ? input.nums
        : JSON.parse(input.nums);

      const target = input.target;

      return `${nums.join(" ")}\n${target}`;
    } catch (err) {
      return "";
    }
  }

  return String(input);
}

// OUTPUT NORMALIZER
function normalizeOutput(output) {
  return String(output || "").replace(/\s+/g, "").trim();
}

async function judge({ code, language, testcases, runner, timeLimit = 3000 }) {
  const results = [];

  for (let i = 0; i < testcases.length; i++) {
    const test = testcases[i];

    // 🔥 SAFE GUARD (IMPORTANT FIX)
    if (!test || !test.input) {
      return {
        status: "Invalid Testcase",
        failedCase: i + 1,
        results
      };
    }

    let finalCode = code;

    const input = test.input;

    // WRAPPER
    if (language === "java") finalCode = wrapJava(code, input);
    else if (language === "cpp") finalCode = wrapCpp(code, input);
    else if (language === "python") finalCode = wrapPython(code, input);
    else if (language === "javascript") finalCode = wrapJS(code, input);

    const inputString = normalizeInput(input);

    let result;

    try {
      result = await Promise.race([
        runner(finalCode, inputString),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("TLE")), timeLimit)
        )
      ]);
    } catch (err) {
      result = {
        status: err.message === "TLE" ? "Time Limit Exceeded" : "Runtime Error",
        output: ""
      };
    }

    const userOutput = normalizeOutput(result.output);
    const expected = normalizeOutput(test.output);

    let verdict = "Accepted";

    if (result.status !== "Success" && result.status !== "Accepted") {
      verdict = result.status;
    } else if (userOutput !== expected) {
      verdict = "Wrong Answer";
    }

    results.push({
      case: i + 1,
      input,
      expected: test.output,
      output: result.output,
      verdict
    });

    if (verdict !== "Accepted") {
      return {
        status: verdict,
        failedCase: i + 1,
        results
      };
    }
  }

  return {
    status: "Accepted",
    results
  };
}

module.exports = { judge };