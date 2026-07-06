function buildEditorialPrompt(
   problem
) {

   return `
You are an expert competitive programming educator.

Given the following problem:

TITLE:
${problem.title}

DESCRIPTION:
${problem.description}

INPUT FORMAT:
${problem.inputFormat}

OUTPUT FORMAT:
${problem.outputFormat}

CONSTRAINTS:
${problem.constraints.join("\n")}

SAMPLE INPUT:
${problem.sampleInput}

SAMPLE OUTPUT:
${problem.sampleOutput}

EXPLANATION:
${problem.explanation}

Generate a clean editorial containing:

1. Intuition
2. Brute Force Approach
3. Optimized Approach
4. Time Complexity
5. Space Complexity
6. Important Edge Cases

Return ONLY valid JSON in this format:

{
  "intuition": "detailed intuition...",
  "bruteForce": "detailed brute force approach...",
  "optimized": "detailed optimized approach...",
  "timeComplexity": "e.g., O(N)",
  "spaceComplexity": "e.g., O(1)",
  "edgeCases": [
    "Description of edge case 1",
    "Description of edge case 2"
  ]
}

CRITICAL: The "edgeCases" field must be a flat array of strings. Do NOT output objects (like {"name": "...", "description": "..."}) or nested JSON strings inside this array.
`;
}

module.exports =
   buildEditorialPrompt;