module.exports = [
  {
    title: "Two Sum Arena",
    difficulty: "Easy",
    description:
      "Given an integer array nums and an integer target, print the zero-based indices of two numbers such that they add up to target. Output the smaller index first, separated by a space.",
    constraints: [
      "2 <= nums.length <= 10^5",
      "-10^9 <= nums[i] <= 10^9",
      "Exactly one valid answer exists",
    ],
    starterCode: {
      cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    int n, target;
    cin >> n >> target;
    vector<int> nums(n);
    for (int i = 0; i < n; i++) cin >> nums[i];

    // Write your solution here.
    return 0;
}
`,
      java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        int target = sc.nextInt();
        int[] nums = new int[n];
        for (int i = 0; i < n; i++) nums[i] = sc.nextInt();

        // Write your solution here.
    }
}
`,
      python: `def main():
    n, target = map(int, input().split())
    nums = list(map(int, input().split()))

    # Write your solution here.

if __name__ == "__main__":
    main()
`,
    },
    sampleTestCases: [
      { input: "4 9\n2 7 11 15\n", output: "0 1", explanation: "2 + 7 = 9" },
      { input: "5 6\n3 2 4 1 5\n", output: "1 2", explanation: "2 + 4 = 6" },
    ],
    hiddenTestCases: [
      { input: "6 10\n8 1 2 7 11 3\n", output: "2 3" },
      { input: "7 0\n-3 4 3 90 -1 1 2\n", output: "0 2" },
    ],
  },
  {
    title: "Balanced Brackets Blitz",
    difficulty: "Medium",
    description:
      "Given a string containing only (), {}, and [], print YES if the brackets are balanced, otherwise print NO.",
    constraints: [
      "1 <= s.length <= 10^5",
      "String contains only bracket characters",
    ],
    starterCode: {
      cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    string s;
    cin >> s;

    // Write your solution here.
    return 0;
}
`,
      java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String s = sc.next();

        // Write your solution here.
    }
}
`,
      python: `def main():
    s = input().strip()

    # Write your solution here.

if __name__ == "__main__":
    main()
`,
    },
    sampleTestCases: [
      { input: "{[()]}\n", output: "YES", explanation: "Every opener is matched in order." },
      { input: "{[(])}\n", output: "NO", explanation: "The nesting order breaks." },
    ],
    hiddenTestCases: [
      { input: "(((())))\n", output: "YES" },
      { input: "]\n", output: "NO" },
    ],
  },
  {
    title: "Longest Unique Substring Sprint",
    difficulty: "Medium",
    description:
      "Given a lowercase string s, print the length of the longest substring without repeating characters.",
    constraints: [
      "1 <= s.length <= 2 * 10^5",
      "s consists of lowercase English letters",
    ],
    starterCode: {
      cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    string s;
    cin >> s;

    // Write your solution here.
    return 0;
}
`,
      java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String s = sc.next();

        // Write your solution here.
    }
}
`,
      python: `def main():
    s = input().strip()

    # Write your solution here.

if __name__ == "__main__":
    main()
`,
    },
    sampleTestCases: [
      { input: "abcabcbb\n", output: "3", explanation: "abc is the longest unique substring." },
      { input: "bbbbb\n", output: "1", explanation: "Only one unique character can be used." },
    ],
    hiddenTestCases: [
      { input: "pwwkew\n", output: "3" },
      { input: "abba\n", output: "2" },
    ],
  },
];
