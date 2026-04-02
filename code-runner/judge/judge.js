const { wrapJava, wrapCpp, wrapPython, wrapJS } = require("./wrappers");

// ✅ normalize input (PURE FUNCTION)
function normalizeInput(input) {
  if (typeof input === "object") {
    const nums = JSON.parse(input.nums).join(" ");
    const target = input.target;
    return `${nums}\n${target}`;
  }
  return String(input || "");
}

// ✅ normalize output (IMPORTANT)
function normalizeOutput(output) {
  return output.replace(/\s+/g, "").trim();
}

async function judge({ code, language, testcases, runner, timeLimit = 3000 }) {
  const results = [];

  for (let i = 0; i < testcases.length; i++) {
    const test = testcases[i];

    let finalCode = code;

    // 🔥 Apply wrapper
    if (language === "java") finalCode = wrapJava(code, test.input);
    else if (language === "cpp") finalCode = wrapCpp(code, test.input);
    else if (language === "python") finalCode = wrapPython(code, test.input);
    else if (language === "javascript") finalCode = wrapJS(code, test.input);

    const inputString = normalizeInput(test.input);

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

    const userOutput = normalizeOutput(result.output || "");
    const expected = normalizeOutput(test.output || "");

    let verdict = "Accepted";

    if (result.status !== "Success" && result.status !== "Accepted") {
      verdict = result.status;
    } else if (userOutput !== expected) {
      verdict = "Wrong Answer";
    }

    results.push({
      case: i + 1,
      input: test.input,
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