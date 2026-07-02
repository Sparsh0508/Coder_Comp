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
         easy: { minN: 500, maxN: 2000, expectedComplexity: "O(n^2)" },
         medium: { minN: 50000, maxN: 120000, expectedComplexity: "O(n)" },
         hard: { minN: 150000, maxN: 300000, expectedComplexity: "O(n)" }
      },
      pair_sum_count: {
         easy: { minN: 800, maxN: 3000, expectedComplexity: "O(n^2)" },
         medium: { minN: 80000, maxN: 220000, expectedComplexity: "O(n)" },
         hard: { minN: 180000, maxN: 350000, expectedComplexity: "O(n)" }
      },
      prefix_sum_subarray_count: {
         easy: { minN: 800, maxN: 3000, expectedComplexity: "O(n^2)" },
         medium: { minN: 80000, maxN: 220000, expectedComplexity: "O(n)" },
         hard: { minN: 180000, maxN: 350000, expectedComplexity: "O(n)" }
      },
      sliding_window_max_sum: {
         easy: { minN: 800, maxN: 3000, expectedComplexity: "O(n^2)" },
         medium: { minN: 80000, maxN: 220000, expectedComplexity: "O(n)" },
         hard: { minN: 180000, maxN: 350000, expectedComplexity: "O(n)" }
      }
   };

   const selected =
      table[family][normalized] || table[family].easy;

   const valueLimits =
      [1000, 100000, 1000000000];

   return {
      n: randomInt(selected.minN, selected.maxN),
      valueLimit: valueLimits[randomInt(0, valueLimits.length - 1)],
      expectedComplexity: selected.expectedComplexity
   };
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

function solveFixedWindowMaxSum(input) {
   let current = 0;

   for(let index = 0; index < input.k; index++) {
      current += input.arr[index];
   }

   let best = current;

   for(let index = input.k; index < input.n; index++) {
      current += input.arr[index] - input.arr[index - input.k];
      best = Math.max(best, current);
   }

   return String(best);
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

function buildSlidingWindowTests(structure) {
   const maxN =
      Math.min(structure.constraints.n, 120000);

   const tests = [
      { n: 6, k: 3, arr: [2, 1, 5, 1, 3, 2] },
      { n: 5, k: 2, arr: [-5, -2, -8, -1, -4] },
      { n: 4, k: 4, arr: [10, -3, 2, 7] },
      { n: 7, k: 1, arr: [4, -1, 9, 3, 2, 8, 0] }
   ];

   tests.push({
      n: maxN,
      k: Math.max(1, Math.floor(maxN / 3)),
      arr: Array.from({ length: maxN }, (_, index) => index % 5 === 0 ? 50 : -3)
   });

   for(let i = 0; i < 20; i++) {
      const n = randomInt(8, 50);
      tests.push({
         n,
         k: randomInt(1, n),
         arr: Array.from({ length: n }, () => randomInt(-100, 100))
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
               `-${structure.constraints.valueLimit} <= arr[i] <= ${structure.constraints.valueLimit}`,
               `-${structure.constraints.valueLimit} <= target <= ${structure.constraints.valueLimit}`,
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
               `-${structure.constraints.valueLimit} <= arr[i] <= ${structure.constraints.valueLimit}`,
               `-${structure.constraints.valueLimit} <= target <= ${structure.constraints.valueLimit}`,
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
   },
   {
      id: "sliding_window_max_sum",
      pattern: "sliding-window",
      aliases: ["sliding_window", "slidingwindow", "fixed_window", "fixed-window"],
      label: "Sliding Window Max Sum",
      createStructure({ difficulty, theme }) {
         return {
            pattern: "sliding-window",
            concepts: ["array", "sliding-window"],
            mutation: {
               type: "fixed_window_sum",
               windowRange: [1, "n"]
            },
            constraints: constraintsFor(difficulty, "sliding_window_max_sum"),
            theme,
            family: this.id
         };
      },
      normalizeProblem(aiProblem, structure) {
         return {
            ...aiProblem,
            title: aiProblem.title || "Fixed Window Treasure",
            description: "Given an array of integers and a window size k, find the maximum possible sum of any contiguous subarray containing exactly k elements.",
            inputFormat: "The first line contains n and k. The second line contains n integers.",
            outputFormat: "Print one integer: the maximum sum of a contiguous window of length k.",
            constraints: [
               `1 <= k <= n <= ${structure.constraints.n}`,
               `-${structure.constraints.valueLimit} <= arr[i] <= ${structure.constraints.valueLimit}`,
               "Use a 64-bit integer for window sums.",
               "The window must contain exactly k contiguous elements."
            ],
            tags: Array.from(new Set([...(aiProblem.tags || []), "array", "sliding-window"])),
            explanation: "Keep the sum of the current k-length window. Slide the window one index at a time by adding the new element and removing the element that left."
         };
      },
      buildSamples() {
         return [
            {
               input: "6 3\n2 1 5 1 3 2\n",
               output: solveFixedWindowMaxSum({ n: 6, k: 3, arr: [2, 1, 5, 1, 3, 2] }),
               explanation: "The best length-3 window is [5, 1, 3] with sum 9."
            },
            {
               input: "5 2\n-5 -2 -8 -1 -4\n",
               output: solveFixedWindowMaxSum({ n: 5, k: 2, arr: [-5, -2, -8, -1, -4] }),
               explanation: "The maximum sum can still be negative; the best window is [-1, -4]."
            }
         ];
      },
      buildHiddenTests: buildSlidingWindowTests,
      generateOutputs(tests) {
         return tests.map((test) => ({
            input: [
               `${test.n} ${test.k}`,
               test.arr.join(" ")
            ].join("\n") + "\n",
            output: solveFixedWindowMaxSum(test)
         }));
      },
      buildStarterCode() {
         return {
            cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n, k;
    cin >> n >> k;
    vector<long long> arr(n);
    for (int i = 0; i < n; i++) cin >> arr[i];

    // Print the maximum sum among all windows of length k.
    return 0;
}
`,
            java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        int k = sc.nextInt();
        long[] arr = new long[n];
        for (int i = 0; i < n; i++) arr[i] = sc.nextLong();

        // Print the maximum sum among all windows of length k.
    }
}
`,
            python: `def main():
    n, k = map(int, input().split())
    arr = list(map(int, input().split()))

    # Print the maximum sum among all windows of length k.

if __name__ == "__main__":
    main()
`
         };
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

    int n, k;
    cin >> n >> k;
    vector<long long> arr(n);
    for (int i = 0; i < n; i++) cin >> arr[i];

    long long current = 0;
    for (int i = 0; i < k; i++) current += arr[i];

    long long best = current;
    for (int i = k; i < n; i++) {
        current += arr[i] - arr[i - k];
        best = max(best, current);
    }

    cout << best << '\\n';
    return 0;
}
`
         };
      },
      buildFallbackEditorial() {
         return {
            intuition: "Adjacent fixed-size windows share almost all elements, so recomputing every sum from scratch wastes work.",
            bruteForce: "For each start index, sum the next k elements and keep the maximum.",
            optimized: "Compute the first window sum once, then slide by adding the entering value and subtracting the leaving value.",
            timeComplexity: "O(n)",
            spaceComplexity: "O(1)",
            edgeCases: ["k = 1", "k = n", "All values negative", "Multiple windows with the same maximum sum"]
         };
      }
   }
];

function selectProblemFamily(requestedFamily) {
   if(requestedFamily) {
      const normalized =
         String(requestedFamily).toLowerCase();

      const normalizedAlias =
         normalized.replace(/-/g, "_");

      const family =
      families.find((entry) => {
         const aliases = entry.aliases || [];

         return entry.id === normalized ||
            entry.id === normalizedAlias ||
            entry.pattern === normalized ||
            entry.pattern === normalizedAlias ||
            aliases.includes(normalized) ||
            aliases.includes(normalizedAlias);
      });

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
