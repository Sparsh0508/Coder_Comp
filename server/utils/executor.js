async function createLocalSubmission({ sourceCode, language, stdin }) {
  const baseUrl = process.env.CODE_RUNNER_URL || "http://localhost:5001";
  console.log(baseUrl);
  
  const response = await fetch(`${baseUrl}/api/execute`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      code: sourceCode,
      language,
      stdin,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Local runner request failed: ${response.status} ${errorBody}`);
  }

  return response.json();
}

function normalizeOutput(value = "") {
  return String(value).trim().replace(/\r\n/g, "\n");
}

async function evaluateCode({ sourceCode, language, testCases }) {
  const supportedLanguages = new Set(["cpp", "java", "python"]);

  if (!supportedLanguages.has(language)) {
    throw new Error("Unsupported language");
  }

  const results = [];

  for (const testCase of testCases) {
    const execution = await createLocalSubmission({
      sourceCode,
      language,
      stdin: testCase.input,
    });

    const actualOutput = normalizeOutput(execution.output || execution.stdout || execution.error || execution.stderr || "");
    const expectedOutput = normalizeOutput(testCase.output);
    const passed = actualOutput === expectedOutput && ["Success", "Accepted"].includes(execution.status);

    results.push({
      input: testCase.input,
      expectedOutput,
      actualOutput,
      passed,
      executionTime: Number(execution.time || 0),
      memory: Number(execution.memory || 0),
      status: execution.status || "Unknown",
    });
  }

  const passedCount = results.filter((result) => result.passed).length;

  return {
    allPassed: passedCount === results.length,
    passedCount,
    totalCount: results.length,
    maxTime: results.reduce((max, result) => Math.max(max, result.executionTime), 0),
    maxMemory: results.reduce((max, result) => Math.max(max, result.memory), 0),
    outputSummary: results.map((result) => result.actualOutput).join("\n---\n"),
    testCases: results,
  };
}

module.exports = {
  evaluateCode,
};
