// function buildPrompt(problemData) {

// //    return `

// // Generate a UNIQUE coding contest problem.

// // Rules:
// // - Do NOT copy famous problems.
// // - Avoid standard LeetCode wording.
// // - Create realistic constraints.
// // - Include edge cases naturally.
// // - Keep the problem logically valid.

// // Problem Structure:

// // Pattern:
// // ${problemData.pattern}

// // Theme:
// // ${problemData.theme}

// // Mutation:
// // ${JSON.stringify(problemData.mutation)}

// // Constraints:
// // ${JSON.stringify(problemData.constraints)}

// // Return ONLY valid JSON in this format:

// // {
// //   "title": "",
// //   "description": "",
// //   "inputFormat": "",
// //   "outputFormat": "",
// //   "constraints": [],
// //   "sampleInput": "",
// //   "sampleOutput": "",
// //   "explanation": ""
// // }

// // `;
// return `
// You are an expert competitive programming problem setter.

// Your task is to generate a UNIQUE coding contest problem STRICTLY based on the provided structure.

// VERY IMPORTANT RULES:

// 1. DO NOT invent unrelated algorithms.
// 2. DO NOT change the core pattern.
// 3. DO NOT introduce graph, DP, greedy, interval optimization, or advanced mechanics unless explicitly provided.
// 4. The generated problem MUST follow the provided concepts and mutation rules exactly.
// 5. The intended solution complexity MUST match the expected complexity.
// 6. The problem should feel like a real contest problem.
// 7. Avoid copying famous LeetCode or Codeforces statements.
// 8. Keep the problem logically solvable.
// 9. Generate ONLY RAW JSON.
// 10. DO NOT wrap response in markdown.
// 11. DO NOT use '````' json.
// 12. DO NOT add explanations outside JSON.

// ---

// ## PROBLEM STRUCTURE

// Pattern:
// ${problemData.pattern}

// Concepts:
// ${problemData.concepts.join(", ")}

// Theme:
// ${problemData.theme}

// Mutation:
// ${JSON.stringify(problemData.mutation)}

// Constraints:
// ${JSON.stringify(problemData.constraints)}

// ---

// ## STRICT MECHANIC REQUIREMENTS

// The problem MUST use:

// * pair matching logic
// * array/hashmap based thinking
// * the provided mutation directly

// If mutation type is:
// "distance_constraint"

// then the problem MUST contain a rule:

// |i - j| >= minDistance

// where:
// minDistance = ${problemData.mutation.minDistance}

// The intended solution should primarily use:
// ${problemData.concepts.join(", ")}

// Expected complexity:
// ${problemData.constraints.expectedComplexity}

// DO NOT create:

// * interval optimization
// * graph traversal
// * dynamic programming
// * subset selection
// * scheduling problems
// * coverage problems

// unless explicitly mentioned in the structure.

// ---

// ## OUTPUT FORMAT

// Return ONLY valid JSON in this exact format:

// {
// "title": "",
// "description": "",
// "inputFormat": "",
// "outputFormat": "",
// "constraints": [],
// "sampleInput": "",
// "sampleOutput": "",
// "explanation": "",
// "tags": [],
// "difficulty": ""
// }

// ---

// ## QUALITY RULES

// The generated problem should:

// * feel unique
// * be easy to understand
// * have realistic constraints
// * contain valid sample testcases
// * have internally consistent logic
// * match the required algorithmic pattern

// The sample explanation MUST correctly match:

// * input
// * output
// * constraints
// * rules

// Return RAW JSON ONLY.
// ```
// }

// module.exports = buildPrompt;
const getMutationRules =
   require("../mutations/mutationRules");

function buildPrompt(problemData) {

   const mutation =
      problemData.mutation || {};

   const constraints =
      problemData.constraints || {};

   const concepts =
      problemData.concepts || [];

   const mutationRules =
      getMutationRules(mutation);

   return `
You are an expert competitive programming problem setter.

Your task is to generate a UNIQUE coding contest problem STRICTLY based on the provided structure.

IMPORTANT RULES:

1. DO NOT invent unrelated algorithms.
2. DO NOT change the core pattern.
3. DO NOT introduce graph, DP, greedy, interval optimization, or advanced mechanics unless explicitly provided.
4. The generated problem MUST follow the provided concepts and mutation rules exactly.
5. The intended solution complexity MUST match the expected complexity.
6. The problem should feel like a real coding contest problem.
7. Avoid copying famous LeetCode or Codeforces statements.
8. Keep the problem logically solvable.
9. Generate ONLY RAW JSON.
10. DO NOT wrap response in markdown.
11. DO NOT use markdown code blocks.
12. DO NOT add explanations outside JSON.

--------------------------------------------------
PROBLEM STRUCTURE
--------------------------------------------------

Pattern:
${problemData.pattern || "unknown"}

Concepts:
${concepts.join(", ")}

Theme:
${problemData.theme || "general"}

Mutation:
${JSON.stringify(mutation)}

--------------------------------------------------
MUTATION SPECIFIC RULES
--------------------------------------------------

${mutationRules}

Constraints:
${JSON.stringify(constraints)}

--------------------------------------------------
STRICT MECHANIC REQUIREMENTS
--------------------------------------------------

The problem MUST use:
- the provided pattern directly
- the listed concepts as the intended solution basis
- the provided mutation directly

The intended solution should primarily use:
${concepts.join(", ")}

Expected complexity:
${constraints.expectedComplexity || "O(n)"}

DO NOT create:
- interval optimization
- graph traversal
- dynamic programming
- subset selection
- scheduling problems
- coverage problems

unless explicitly mentioned in the structure.

--------------------------------------------------
OUTPUT FORMAT
--------------------------------------------------

Return ONLY valid JSON in this exact format:

{
  "title": "",
  "description": "",
  "inputFormat": "",
  "outputFormat": "",
  "constraints": [],
  "sampleInput": "",
  "sampleOutput": "",
  "explanation": "",
  "tags": [],
  "difficulty": ""
}

--------------------------------------------------
QUALITY RULES
--------------------------------------------------

The generated problem should:
- feel unique
- be easy to understand
- have realistic constraints
- contain valid sample testcases
- have internally consistent logic
- match the required algorithmic pattern

The sample explanation MUST correctly match:
- input
- output
- constraints
- rules

Return RAW JSON ONLY.
`;
}

module.exports = buildPrompt;
