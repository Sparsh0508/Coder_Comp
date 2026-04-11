const LANGUAGE_MAP = {
  cpp: 54,
  java: 62,
  python: 71,
};

async function createJudgeSubmission({ sourceCode, languageId, stdin, expectedOutput }) {
  const baseUrl = process.env.JUDGE0_URL;

  if (!baseUrl) {
    throw new Error("JUDGE0_URL is not configured");
  }

  const headers = {
    "Content-Type": "application/json",
  };

  if (process.env.JUDGE0_API_KEY) {
    headers["X-Auth-Token"] = process.env.JUDGE0_API_KEY;
  }

  const response = await fetch(`${baseUrl}/submissions?base64_encoded=false&wait=true`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      source_code: sourceCode,
      language_id: languageId,
      stdin,
      expected_output: expectedOutput,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Judge0 request failed: ${response.status} ${errorBody}`);
  }

  return response.json();
}

function normalizeOutput(value = "") {
  return String(value).trim().replace(/\r\n/g, "\n");
}

async function evaluateCode({ sourceCode, language, testCases }) {
  const languageId = LANGUAGE_MAP[language];

  if (!languageId) {
    throw new Error("Unsupported language");
  }

  const results = [];

  for (const testCase of testCases) {
    const judgeResult = await createJudgeSubmission({
      sourceCode,
      languageId,
      stdin: testCase.input,
      expectedOutput: testCase.output,
    });

    const actualOutput = normalizeOutput(judgeResult.stdout || judgeResult.compile_output || judgeResult.stderr || "");
    const expectedOutput = normalizeOutput(testCase.output);
    const passed = actualOutput === expectedOutput && Number(judgeResult.status?.id) === 3;

    results.push({
      input: testCase.input,
      expectedOutput,
      actualOutput,
      passed,
      executionTime: Number(judgeResult.time || 0),
      memory: Number(judgeResult.memory || 0),
      status: judgeResult.status?.description || "Unknown",
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
