const pairDistanceSpec =
   require("./pairMatchingDistanceSpec");

function randomInt(min, max) {
   return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle(values) {
   return [...values].sort(() => Math.random() - 0.5);
}

function constraintsFor(difficulty, family) {
   const normalized =
      String(difficulty || "easy").toLowerCase();

   const table = {
      pair_equal_distance: {
         easy: { n: 1000, expectedComplexity: "O(n^2)" },
         medium: { n: 100000, expectedComplexity: "O(n)" },
         hard: { n: 200000, expectedComplexity: "O(n)" }
      },
      pair_sum_count: {
         easy: { n: 2000, expectedComplexity: "O(n^2)" },
         medium: { n: 200000, expectedComplexity: "O(n)" },
         hard: { n: 300000, expectedComplexity: "O(n)" }
      },
      prefix_sum_subarray_count: {
         easy: { n: 2000, expectedComplexity: "O(n^2)" },
         medium: { n: 200000, expectedComplexity: "O(n)" },
         hard: { n: 300000, expectedComplexity: "O(n)" }
      }
   };

   return table[family][normalized] || table[family].easy;
}

function toArrayInput(input) {
   return [
      `${input.n} ${input.target}`,
      input.arr.join(" ")
   ].join("\n") + "\n";
}

function solvePairSum(input) {
   const freq = new Map();
   let count = 0;

   for(const value of input.arr) {
      count += freq.get(input.target - value) || 0;
      freq.set(value, (freq.get(value) || 0) + 1);
   }

   return String(count);
}

function solveSubarraySum(input) {
   const freq = new Map([[0, 1]]);
   let prefix = 0;
   let count = 0;

   for(const value of input.arr) {
      prefix += value;
      count += freq.get(prefix - input.target) || 0;
      freq.set(prefix, (freq.get(prefix) || 0) + 1);
   }

   return String(count);
}

function makeTextCase(input, solver, explanation) {
   return {
      input: toArrayInput(input),
      output: solver(input),
      ...(explanation ? { explanation } : {})
   };
}

function buildPairSumTests(structure) {
   const maxN =
      Math.min(structure.constraints.n, 100000);

   const tests = [
      { n: 5, target: 6, arr: [1, 5, 3, 3, 2] },
      { n: 6, target: 0, arr: [-2, 2, 0, 0, 4, -4] },
      { n: 8, target: 10, arr: [5, 5, 5, 5, 1, 9, 2, 8] },
      { n: 7, target: 100, arr: [1, 2, 3, 4, 5, 6, 7] }
   ];

   const maxArr =
      Array.from({ length: maxN }, (_, index) => index % 2 === 0 ? 1 : 9);

   tests.push({
      n: maxN,
      target: 10,
      arr: maxArr
   });

   for(let i = 0; i < 20; i++) {
      const n = randomInt(8, 40);
      const arr = Array.from({ length: n }, () => randomInt(-20, 20));
      tests.push({
         n,
         target: randomInt(-15, 15),
         arr
      });
   }

   return tests;
}

function buildSubarrayTests(structure) {
   const maxN =
      Math.min(structure.constraints.n, 100000);

   const tests = [
      { n: 5, target: 3, arr: [1, 2, 1, 1, 1] },
      { n: 5, target: 0, arr: [0, 0, 0, 0, 0] },
      { n: 6, target: 4, arr: [4, -1, 1, 2, -2, 4] },
      { n: 6, target: 50, arr: [1, 2, 3, 4, 5, 6] }
   ];

   const maxArr =
      Array.from({ length: maxN }, (_, index) => index % 3 === 0 ? 1 : -1);

   tests.push({
      n: maxN,
      target: 0,
      arr: maxArr
   });

   for(let i = 0; i < 20; i++) {
      const n = randomInt(8, 45);
      const arr = Array.from({ length: n }, () => randomInt(-8, 8));
      tests.push({
         n,
         target: randomInt(-10, 10),
         arr
      });
   }

   return tests;
}

function starterCode(comment) {
   return {
      cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    long long target;
    cin >> n >> target;
    vector<long long> arr(n);
    for (int i = 0; i < n; i++) cin >> arr[i];

    // ${comment}
    return 0;
}
`,
      java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        long target = sc.nextLong();
        long[] arr = new long[n];
        for (int i = 0; i < n; i++) arr[i] = sc.nextLong();

        // ${comment}
    }
}
`,
      python: `def main():
    n, target = map(int, input().split())
    arr = list(map(int, input().split()))

    # ${comment}

if __name__ == "__main__":
    main()
`
   };
}

const families = [
   {
      id: "pair_equal_distance",
      pattern: "pair_matching",
      label: "Equal Pair Distance",
      createStructure({ difficulty, theme }) {
         const minDistance =
            randomInt(1, 5);

         return {
            pattern: "pair_matching",
            concepts: ["array", "hashmap"],
            mutation: {
               type: "distance_constraint",
               minDistance
            },
            constraints: constraintsFor(difficulty, "pair_equal_distance"),
            theme,
            family: this.id
         };
      },
      normalizeProblem: pairDistanceSpec.normalizeAiProblem,
      buildSamples(structure) {
         return pairDistanceSpec.buildSamples(structure.mutation.minDistance);
      },
      buildHiddenTests(structure) {
         const buildHiddenTests =
            require("../testcases/hidden/buildHiddenTests");

         return buildHiddenTests(structure);
      },
      generateOutputs(tests) {
         const generateOutputs =
            require("../testcases/hidden/generateOutputs");

         return generateOutputs(tests);
      },
      buildStarterCode: pairDistanceSpec.buildStarterCode,
      buildReferenceSolution: pairDistanceSpec.buildReferenceSolution,
      buildFallbackEditorial() {
         return {
            intuition: "Only equal values can form a valid pair, and the distance rule filters which earlier indices are eligible.",
            bruteForce: "Check every pair and count those with equal values and enough distance.",
            optimized: "Maintain counts of values whose indices are at least minDistance behind the current index.",
            timeComplexity: "O(n)",
            spaceComplexity: "O(n)",
            edgeCases: ["All values equal", "All values unique", "minDistance is 1", "minDistance is close to n"]
         };
      }
   },
   {
      id: "pair_sum_count",
      pattern: "pair_matching",
      label: "Pair Sum Count",
      createStructure({ difficulty, theme }) {
         return {
            pattern: "pair_matching",
            concepts: ["array", "hashmap", "frequency-counting"],
            mutation: {
               type: "target_sum_count",
               targetRange: [-1000000000, 1000000000]
            },
            constraints: constraintsFor(difficulty, "pair_sum_count"),
            theme,
            family: this.id
         };
      },
      normalizeProblem(aiProblem, structure) {
         return {
            ...aiProblem,
            title: aiProblem.title || "Target Pair Counter",
            description: "Given an array of integers and a target value, count the number of index pairs (i, j) such that i < j and arr[i] + arr[j] = target.",
            inputFormat: "The first line contains n and target. The second line contains n integers.",
            outputFormat: "Print one integer: the number of valid target-sum pairs.",
            constraints: [
               `2 <= n <= ${structure.constraints.n}`,
               "-10^9 <= arr[i] <= 10^9",
               "-10^9 <= target <= 10^9",
               "Count pairs by index, not by distinct value."
            ],
            tags: Array.from(new Set([...(aiProblem.tags || []), "array", "hashmap", "pair-counting"])),
            explanation: "For each value, count how many earlier values complete the target sum."
         };
      },
      buildSamples() {
         return [
            makeTextCase({ n: 5, target: 6, arr: [1, 5, 3, 3, 2] }, solvePairSum, "The valid pairs are (1, 5) and the two index-distinct (3, 3) choices."),
            makeTextCase({ n: 4, target: 10, arr: [1, 2, 3, 4] }, solvePairSum, "No pair sums to 10.")
         ];
      },
      buildHiddenTests: buildPairSumTests,
      generateOutputs(tests) {
         return tests.map((test) => ({
            input: toArrayInput(test),
            output: solvePairSum(test)
         }));
      },
      buildStarterCode() {
         return starterCode("Print the number of index pairs whose values sum to target.");
      },
      buildReferenceSolution() {
         return {
            language: "cpp",
            complexity: "O(n)",
            code: `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    long long target;
    cin >> n >> target;
    vector<long long> arr(n);
    for (int i = 0; i < n; i++) cin >> arr[i];

    unordered_map<long long, long long> freq;
    long long answer = 0;
    for (long long value : arr) {
        answer += freq[target - value];
        freq[value]++;
    }

    cout << answer << '\\n';
    return 0;
}
`
         };
      },
      buildFallbackEditorial() {
         return {
            intuition: "When reading a value x, every previous target - x forms a valid pair with it.",
            bruteForce: "Check all pairs and count sums equal to target.",
            optimized: "Scan left to right and keep a frequency map of earlier values.",
            timeComplexity: "O(n)",
            spaceComplexity: "O(n)",
            edgeCases: ["Duplicate values", "Negative values", "No valid pairs", "Many identical valid pairs"]
         };
      }
   },
   {
      id: "prefix_sum_subarray_count",
      pattern: "prefix_sum",
      label: "Prefix Sum Subarray Count",
      createStructure({ difficulty, theme }) {
         return {
            pattern: "prefix_sum",
            concepts: ["array", "hashmap", "prefix-sum"],
            mutation: {
               type: "negative_values_allowed",
               valueRange: [-1000000000, 1000000000]
            },
            constraints: constraintsFor(difficulty, "prefix_sum_subarray_count"),
            theme,
            family: this.id
         };
      },
      normalizeProblem(aiProblem, structure) {
         return {
            ...aiProblem,
            title: aiProblem.title || "Target Subarray Counter",
            description: "Given an array of integers and a target value, count the number of contiguous subarrays whose sum is exactly target. Values may be negative, so a sliding window is not reliable.",
            inputFormat: "The first line contains n and target. The second line contains n integers.",
            outputFormat: "Print one integer: the number of contiguous subarrays with sum equal to target.",
            constraints: [
               `1 <= n <= ${structure.constraints.n}`,
               "-10^9 <= arr[i] <= 10^9",
               "-10^9 <= target <= 10^9",
               "The answer may be larger than n, so use a 64-bit integer."
            ],
            tags: Array.from(new Set([...(aiProblem.tags || []), "array", "hashmap", "prefix-sum"])),
            explanation: "Use prefix sums: a subarray ending at the current index has sum target when an earlier prefix equals currentPrefix - target."
         };
      },
      buildSamples() {
         return [
            makeTextCase({ n: 5, target: 3, arr: [1, 2, 1, 1, 1] }, solveSubarraySum, "Several contiguous ranges sum to 3."),
            makeTextCase({ n: 4, target: 0, arr: [1, -1, 1, -1] }, solveSubarraySum, "Negative values allow multiple zero-sum subarrays.")
         ];
      },
      buildHiddenTests: buildSubarrayTests,
      generateOutputs(tests) {
         return tests.map((test) => ({
            input: toArrayInput(test),
            output: solveSubarraySum(test)
         }));
      },
      buildStarterCode() {
         return starterCode("Print the number of contiguous subarrays whose sum is target.");
      },
      buildReferenceSolution() {
         return {
            language: "cpp",
            complexity: "O(n)",
            code: `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    long long target;
    cin >> n >> target;
    vector<long long> arr(n);
    for (int i = 0; i < n; i++) cin >> arr[i];

    unordered_map<long long, long long> prefixCount;
    prefixCount[0] = 1;
    long long prefix = 0;
    long long answer = 0;

    for (long long value : arr) {
        prefix += value;
        answer += prefixCount[prefix - target];
        prefixCount[prefix]++;
    }

    cout << answer << '\\n';
    return 0;
}
`
         };
      },
      buildFallbackEditorial() {
         return {
            intuition: "A subarray sum is the difference of two prefix sums.",
            bruteForce: "Try every start and end index and compute each subarray sum.",
            optimized: "Maintain counts of previous prefix sums and add the number of prefixes equal to currentPrefix - target.",
            timeComplexity: "O(n)",
            spaceComplexity: "O(n)",
            edgeCases: ["All zeros", "Negative values", "No matching subarray", "Large answer requiring 64-bit integer"]
         };
      }
   }
];

function selectProblemFamily(requestedFamily) {
   if(requestedFamily) {
      const normalized =
         String(requestedFamily).toLowerCase();

      const family =
      families.find((entry) => entry.id === normalized || entry.pattern === normalized);

      if(!family) {
         throw new Error(`Unsupported problem family: ${requestedFamily}`);
      }

      return family;
   }

   return shuffle(families)[0];
}

module.exports = {
   families,
   selectProblemFamily
};
