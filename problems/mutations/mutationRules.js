function getMutationRules(
   mutation
) {

   if(!mutation) {

      return "";
   }

   switch(mutation.type) {

      case "circular_array":

         return `
The circular nature MUST directly affect the algorithm.

Examples:
- first and last elements are adjacent
- wrap-around traversal
- circular distance
- modulo indexing

The solution must REQUIRE circular logic.
`;

      case "distance_constraint":

         return `
The problem MUST contain a rule:

|i - j| >= ${mutation.minDistance}

This rule must directly affect which pairs are valid.
`;

      default:

         return "";
   }
}

module.exports =
   getMutationRules;