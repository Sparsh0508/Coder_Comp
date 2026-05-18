function toPublicProblem(problem) {
  if (!problem) {
    return null;
  }

  const source = typeof problem.toObject === "function" ? problem.toObject() : problem;

  return {
    _id: source._id,
    id: source._id,
    title: source.title,
    description: source.description,
    inputFormat: source.inputFormat,
    outputFormat: source.outputFormat,
    constraints: source.constraints || [],
    sampleInput: source.sampleInput,
    sampleOutput: source.sampleOutput,
    explanation: source.explanation,
    tags: source.tags || [],
    difficulty: source.difficulty,
    starterCode: source.starterCode || {},
    sampleTestCases: source.sampleTestCases || [],
    structure: source.structure,
    createdAt: source.createdAt,
  };
}

module.exports = {
  toPublicProblem,
};
