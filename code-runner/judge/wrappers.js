// C++ Wrapper
export const wrapCpp = (code, input) => {
  const nums = JSON.parse(input.nums).join(",");
  const target = input.target;

  return `#include <bits/stdc++.h>
using namespace std;

${code}

int main() {
    vector<int> nums = {${nums}};
    int target = ${target};

    vector<int> res = solve(nums, target);

    cout << "[";
    for (int i = 0; i < res.size(); i++) {
        cout << res[i];
        if (i != res.size() - 1) cout << ", ";
    }
    cout << "]";

    return 0;
}`;
};

// Java Wrapper
export const wrapJava = (code, input) => {
  const nums = JSON.parse(input.nums).join(",");
  const target = input.target;

  // 🔥 remove user imports
  const cleanedCode = code.replace(/import\s+.*;/g, "");

  return `import java.util.*;

${cleanedCode}

public class Main {
    public static void main(String[] args) {
        Solution sol = new Solution();

        int[] nums = new int[]{${nums}};
        int target = ${target};

        int[] res = sol.solve(nums, target);

        System.out.print("[");
        for (int i = 0; i < res.length; i++) {
            System.out.print(res[i]);
            if (i != res.length - 1) System.out.print(", ");
        }
        System.out.print("]");
    }
}`;
};

// Python Wrapper
export const wrapPython = (code, input) => {
  const nums = input.nums;
  const target = input.target;

  return `${code}

if __name__ == "__main__":
    nums = ${nums}
    target = ${target}

    res = solve(nums, target)
    print(res)
`;
};

export const wrapJS = (code, input) => {
  const nums = input.nums;
  const target = input.target;

  return `${code}

const nums = ${nums};
const target = ${target};

const res = solve(nums, target);
console.log(JSON.stringify(res));
`;
};