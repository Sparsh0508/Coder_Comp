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

      const minDistance =
         mutation.minDistance;

      const text = (
         problem.description +
         " " +
         problem.inputFormat +
         " " +
         (problem.constraints || []).join(" ") +
         " " +
         problem.explanation
      ).toLowerCase();

      const hasDistanceRule =
         text.includes("distance") ||
         text.includes("|i - j|") ||
         text.includes("|i-j|") ||
         text.includes("index difference") ||
         text.includes("indices differ") ||
         text.includes(`at least ${minDistance}`) ||
         text.includes(`minimum ${minDistance}`);

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
