function validateConstraints(problem) {

   const constraints =
      problem.constraints || [];

   if(!Array.isArray(constraints)) {

      return {
         valid: false,
         error: "Constraints must be array"
      };
   }

   if(constraints.length === 0) {

      return {
         valid: false,
         error: "No constraints provided"
      };
   }

   return {
      valid: true
   };
}

module.exports =
   validateConstraints;