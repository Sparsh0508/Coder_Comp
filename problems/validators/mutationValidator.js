function validateMutation(structure, problem) {

   const mutation =
      structure.mutation;

   if(!mutation) {

      return {
         valid: false,
         error: "Missing mutation"
      };
   }

   if(
      mutation.type === "distance_constraint"
   ) {

      const text = (
         problem.description +
         " " +
         problem.explanation
      ).toLowerCase();

      const hasDistanceRule =
         text.includes("distance") ||
         text.includes("|i - j|") ||
         text.includes("index difference");

      if(!hasDistanceRule) {

         return {
            valid: false,
            error:
               "Distance constraint missing"
         };
      }
   }

   return {
      valid: true
   };
}

module.exports =
   validateMutation;