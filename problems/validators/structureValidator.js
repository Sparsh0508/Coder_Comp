function validateStructure(problem) {

   const requiredFields = [

      "title",
      "description",
      "inputFormat",
      "outputFormat",
      "constraints",
      "sampleInput",
      "sampleOutput",
      "explanation"
   ];

   for(const field of requiredFields) {

      if(!problem[field]) {

         return {
            valid: false,
            error: `Missing field: ${field}`
         };
      }
   }

   return {
      valid: true
   };
}

module.exports =
   validateStructure;