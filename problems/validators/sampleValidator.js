function validateSamples(problem) {

   if(!problem.sampleInput) {

      return {
         valid: false,
         error: "Missing sample input"
      };
   }

   if(!problem.sampleOutput) {

      return {
         valid: false,
         error: "Missing sample output"
      };
   }

   return {
      valid: true
   };
}

module.exports =
   validateSamples;