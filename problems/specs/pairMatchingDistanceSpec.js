function solve(input) {
   let count = 0;

   for(let i = 0; i < input.arr.length; i++) {
      for(let j = i + 1; j < input.arr.length; j++) {
         if(
            input.arr[i] === input.arr[j] &&
            j - i >= input.minDistance
         ) {
            count++;
         }
      }
   }

   return String(count);
}

function toInputText(input) {
   return [
      `${input.n} ${input.minDistance}`,
      input.arr.join(" ")
   ].join("\n") + "\n";
}

function makeCase(input, explanation) {
   return {
      input: toInputText(input),
      output: solve(input),
      ...(explanation ? { explanation } : {})
   };
}

function buildSamples(minDistance) {
   return [
      makeCase(
         {
            n: 6,
            minDistance,
            arr: [4, 1, 4, 2, 4, 1]
         },
         "The equal pairs satisfying the minimum index distance are counted."
      ),
      makeCase(
         {
            n: 5,
            minDistance,
            arr: [7, 8, 9, 10, 11]
         },
         "All values are unique, so no valid pair exists."
      )
   ];
}

function buildStarterCode() {
   return {
      cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n, minDistance;
    cin >> n >> minDistance;
    vector<long long> arr(n);
    for (int i = 0; i < n; i++) cin >> arr[i];

    // Print the number of equal-value index pairs (i, j) with i < j and j - i >= minDistance.
    return 0;
}
`,
      java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        int minDistance = sc.nextInt();
        long[] arr = new long[n];
        for (int i = 0; i < n; i++) arr[i] = sc.nextLong();

        // Print the number of equal-value index pairs (i, j) with i < j and j - i >= minDistance.
    }
}
`,
      python: `def main():
    n, min_distance = map(int, input().split())
    arr = list(map(int, input().split()))

    # Print the number of equal-value index pairs (i, j) with i < j and j - i >= min_distance.

if __name__ == "__main__":
    main()
`
   };
}

function buildReferenceSolution() {
   return {
      language: "cpp",
      complexity: "O(n)",
      code: `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n, minDistance;
    cin >> n >> minDistance;

    vector<long long> arr(n);
    for (int i = 0; i < n; i++) cin >> arr[i];

    unordered_map<long long, long long> eligibleCounts;
    long long answer = 0;

    for (int j = 0; j < n; j++) {
        int eligibleIndex = j - minDistance;
        if (eligibleIndex >= 0) {
            eligibleCounts[arr[eligibleIndex]]++;
        }

        auto it = eligibleCounts.find(arr[j]);
        if (it != eligibleCounts.end()) {
            answer += it->second;
        }
    }

    cout << answer << '\\n';
    return 0;
}
`
   };
}

function normalizeAiProblem(aiProblem, structure) {
   const minDistance = structure.mutation.minDistance;
   const maxN = structure.constraints.n;

   return {
      ...aiProblem,
      description:
         `Given an array of integers, count the number of index pairs (i, j) such that i < j, arr[i] = arr[j], and j - i >= minDistance. For this generated problem family, minDistance is ${minDistance} in the official tests.`,
      inputFormat:
         "The first line contains n and minDistance. The second line contains n integers.",
      outputFormat:
         "Print one integer: the number of valid pairs.",
      constraints: [
         `2 <= n <= ${maxN}`,
         "1 <= minDistance <= n",
         "-10^9 <= arr[i] <= 10^9",
         `For generated tests, minDistance is ${minDistance}`,
         "A pair (i, j) is valid only when i < j, arr[i] = arr[j], and j - i >= minDistance"
      ],
      tags: Array.from(
         new Set([...(aiProblem.tags || []), "array", "hashmap", "pair-counting"])
      ),
      explanation:
         "Count every equal-value pair whose indices are separated by at least minDistance."
   };
}

module.exports = {
   buildSamples,
   buildReferenceSolution,
   buildStarterCode,
   makeCase,
   normalizeAiProblem,
   solve,
   toInputText
};
