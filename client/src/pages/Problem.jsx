import CodeEditor from "../pages/CodeEditor";
import { useEffect, useState } from "react";

const Problem = () => {
  const [problem, setProblem] = useState(null);

  useEffect(() => {
    // 🔥 later replace with API
    setProblem({
      title: "Two Sum",
      description:
        "Given an array of integers nums and an integer target, return indices of two numbers such that they add up to target.",
      sampleInput: "nums = [2,7,11,15], target = 9",
      sampleOutput: "[0,1]",
      constraints: [
        "2 ≤ nums.length ≤ 10⁴",
        "-10⁹ ≤ nums[i] ≤ 10⁹"
      ]
    });
  }, []);

  return (
    <div className="grid grid-cols-5 h-screen bg-[#0f172a] text-white overflow-hidden">

      {/* 📘 LEFT PANEL */}
      <div className="col-span-2 border-r border-gray-700 p-4 overflow-auto h-full">
        
        <h1 className="text-xl font-bold mb-3">
          {problem?.title}
        </h1>

        <p className="text-gray-300 text-sm mb-4 leading-relaxed">
          {problem?.description}
        </p>

        {/* Example */}
        <h3 className="font-semibold mt-4">Example</h3>
        <pre className="bg-black p-3 rounded text-xs mt-2 whitespace-pre-wrap">
{`Input: ${problem?.sampleInput}
Output: ${problem?.sampleOutput}`}
        </pre>

        {/* Constraints */}
        <h3 className="font-semibold mt-4">Constraints</h3>
        <ul className="text-xs text-gray-400 list-disc ml-4 mt-2 space-y-1">
          {problem?.constraints?.map((c, i) => (
            <li key={i}>{c}</li>
          ))}
        </ul>

      </div>

      {/* 💻 RIGHT PANEL */}
      <div className="col-span-3 h-full flex flex-col">
        <CodeEditor />
      </div>

    </div>
  );
};

export default Problem;