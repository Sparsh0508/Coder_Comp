function validateComplexity(
   structure,
   problem
) {

   const expected =
      structure.constraints
         .expectedComplexity;

   const text =
      JSON.stringify(problem);

   const normalizedExpected =
      String(expected || "")
         .replace(/\s+/g, "")
         .toLowerCase();

   if(
      (
         normalizedExpected === "o(n^2)" ||
         normalizedExpected === "o(n²)"
      ) &&
      text.includes("10^5")
   ) {

      return {
         valid: false,
         error:
            "Constraints imply optimized solution"
      };
   }

   return {
      valid: true
   };
}

module.exports =
   validateComplexity;
