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

      case "target_sum_count":

         return `
The problem MUST count index pairs (i, j) where:
- i < j
- arr[i] + arr[j] = target

Duplicate values create multiple index-distinct pairs.
The intended solution should use a frequency map.
`;

      case "negative_values_allowed":

         return `
The problem MUST allow negative values.
This means sliding window logic is not generally valid.
The intended solution should use prefix sums and a hashmap.
`;

      default:

         return "";
   }
}

module.exports =
   getMutationRules;
