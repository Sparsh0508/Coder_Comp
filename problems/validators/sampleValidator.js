function validateSamples(problem) {

   const sampleTestCases =
      problem.sampleTestCases || [];

   if(!problem.sampleInput && sampleTestCases.length === 0) {

      return {
         valid: false,
         error: "Missing sample input"
      };
   }

   if(!problem.sampleOutput && sampleTestCases.length === 0) {

      return {
         valid: false,
         error: "Missing sample output"
      };
   }

   if(
      sampleTestCases.length > 0 &&
      !sampleTestCases.every((testCase) => testCase.input && testCase.output !== undefined)
   ) {

      return {
         valid: false,
         error: "Invalid sample testcase"
      };
   }

   return {
      valid: true
   };
}

module.exports =
   validateSamples;
