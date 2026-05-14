function buildCodePrompt(
   problem
) {

   return `
You are an expert competitive programmer.

Solve this problem in C++.

TITLE:
${problem.title}

DESCRIPTION:
${problem.description}

Generate ONLY valid JSON:

{
  "code": "",
  "language": "cpp",
  "complexity": ""
}

Rules:
- use optimal solution
- no explanation
- no markdown
- code must compile
`;
}

module.exports =
   buildCodePrompt;