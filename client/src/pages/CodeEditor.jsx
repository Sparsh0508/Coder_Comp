import { useState, useRef, useEffect } from "react";
import Prism from "prismjs";
import "prismjs/components/index";
import "prismjs/themes/prism-tomorrow.css";
import { socket } from "../socket";
import { useNavigate, useParams } from "react-router-dom";

const CodeEditor = () => {
  // 🔥 LeetCode-style boilerplates
  const boilerplates = {
    javascript: `function solve(nums, target) {
  // Write your code here
  
}`,
    python: `def solve(nums, target):
    # Write your code here
    pass`,
    cpp: `vector<int> solve(vector<int>& nums, int target) {
    // Write your code here
    
}`,
    java: `class Solution {
    public int[] solve(int[] nums, int target) {
        // Write your code here
        
    }
}`
  };

  const [language, setLanguage] = useState("javascript");
  const [savedCodes, setSavedCodes] = useState(boilerplates);
  const [code, setCode] = useState(boilerplates.javascript);

  const [output, setOutput] = useState("Run your code...");
  const [activeLine, setActiveLine] = useState(1);

  const [loadingRun, setLoadingRun] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);

  const [activeTab, setActiveTab] = useState("testcase");
const navigate = useNavigate();
const { id } = useParams();
  // 🔥 Structured Testcases
  const [testcases, setTestcases] = useState([
    { nums: "[2,7,11,15]", target: "9" }
  ]);
  const [activeCase, setActiveCase] = useState(0);

  const codeRef = useRef(null);
  const textareaRef = useRef(null);

  const langMap = {
    javascript: "javascript",
    python: "python",
    cpp: "cpp",
    java: "java"
  };

  // 🔥 Highlight
  useEffect(() => {
    if (codeRef.current) {
      const lang = langMap[language] || "javascript";
      const grammar = Prism.languages[lang] || Prism.languages.javascript;
      codeRef.current.innerHTML = Prism.highlight(code, grammar, lang);
    }
  }, [code, language]);

  // 🔥 Save code per language
  useEffect(() => {
    setSavedCodes((prev) => ({
      ...prev,
      [language]: code
    }));
  }, [code]);

  // 🔥 Load code on language switch
  useEffect(() => {
    setCode(savedCodes[language] || boilerplates[language]);
  }, [language]);

  useEffect(() => {
  socket.on("match_result", ({ winner }) => {
    console.log("🏆 WINNER:", winner);

    if (winner === socket.userId) {
      alert("🎉 You Won!");
    } else {
      alert("😢 You Lost!");
    }

    navigate("/dashboard"); // or result page
  });

  return () => {
    socket.off("match_result");
  };
}, []);
  // ✏️ Typing
  const handleChange = (e) => {
    const value = e.target.value;
    setCode(value);

    const cursorPos = e.target.selectionStart;
    const lines = value.substr(0, cursorPos).split("\n").length;
    setActiveLine(lines);
  };

  // ⌨️ Tab + Run shortcut
  const handleKeyDown = (e) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;

      const newCode =
        code.substring(0, start) + "  " + code.substring(end);

      setCode(newCode);

      setTimeout(() => {
        textareaRef.current.selectionStart =
          textareaRef.current.selectionEnd = start + 2;
      }, 0);
    }

    if (e.ctrlKey && e.key === "Enter") {
      runCode();
    }
  };

  // 🔄 Scroll sync
  const handleScroll = (e) => {
    if (codeRef.current) {
      codeRef.current.scrollTop = e.target.scrollTop;
      codeRef.current.scrollLeft = e.target.scrollLeft;
    }
  };

  // ▶ RUN
  const runCode = async () => {
    setLoadingRun(true);
    setOutput("⚡ Running...");
    setActiveTab("result");

    try {
      const current = testcases[activeCase];

      const res = await fetch("http://localhost:5001/api/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          code,
          language,
          input: current
        })
      });

      const data = await res.json();
      console.log("Run response:", data);
      setOutput(data.output || "No output");
    } catch {
      setOutput("❌ Server Error");
    }

    setLoadingRun(false);
  };

  // 🚀 SUBMIT
  const submitCode = async () => {
    setLoadingSubmit(true);
    setOutput("🚀 Submitting...");
    setActiveTab("result");

    try {
      const res = await fetch("http://localhost:5001/api/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          code,
          language,
          testcases
        })
      });

      const data = await res.json();

      if (data.status === "Accepted") {
  setOutput("✅ Accepted 🎉");
   socket.emit("submit_success", {
    matchId: id,          // from useParams()
    userId: socket.userId
  });
} else {
  let msg = `❌ ${data.status}\n\n`;

  data.results.forEach((r) => {
    msg += `Case ${r.case}: ${r.verdict}\n`;

    if (r.verdict !== "Accepted") {
      msg += `Expected: ${r.expected}\n`;
      msg += `Got: ${r.output}\n`;
    }

    msg += "\n";
  });

  setOutput(msg);
}
    } catch {
      setOutput("❌ Server Error");
    }

    setLoadingSubmit(false);
  };

  return (
    <div className="bg-[#0f172a] text-white rounded-lg border border-gray-700 h-full flex flex-col">

      {/* HEADER */}
      <div className="flex justify-between items-center px-4 py-2 bg-[#020617] border-b border-gray-700">

        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="bg-gray-800 px-3 py-1 rounded text-sm"
        >
          <option value="javascript">JavaScript</option>
          <option value="python">Python</option>
          <option value="cpp">C++</option>
          <option value="java">Java</option>
        </select>

        <div className="flex gap-2">
          <button
            onClick={runCode}
            disabled={loadingRun || loadingSubmit}
            className="bg-green-600 px-4 py-1 rounded text-sm hover:bg-green-700"
          >
            {loadingRun ? "Running..." : "Run ▶"}
          </button>

          <button
            onClick={submitCode}
            disabled={loadingRun || loadingSubmit}
            className="bg-blue-600 px-4 py-1 rounded text-sm hover:bg-blue-700"
          >
            {loadingSubmit ? "Submitting..." : "Submit 🚀"}
          </button>
        </div>
      </div>

      {/* EDITOR */}
      <div className="flex flex-[2] border-b border-gray-700">

        {/* Line Numbers */}
        <div className="bg-[#020617] text-gray-500 text-sm px-2 py-2 select-none">
          {code.split("\n").map((_, i) => (
            <div key={i} className={activeLine === i + 1 ? "text-white" : ""}>
              {i + 1}
            </div>
          ))}
        </div>

        {/* Code */}
        <div className="relative flex-1 overflow-auto">
          <pre
            ref={codeRef}
            className="absolute top-0 left-0 w-full p-2 font-mono text-sm pointer-events-none"
          />

          <textarea
            ref={textareaRef}
            value={code}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onScroll={handleScroll}
            spellCheck="false"
            className="w-full h-full bg-transparent text-transparent caret-white outline-none resize-none p-2 font-mono text-sm"
          />
        </div>
      </div>

      {/* TESTCASE PANEL */}
      <div className="flex flex-col flex-1 bg-[#0b1220]">

        {/* Tabs */}
        <div className="flex gap-4 px-3 py-2 border-b border-gray-700 text-sm">
          <button
            onClick={() => setActiveTab("testcase")}
            className={activeTab === "testcase" ? "text-green-400" : "text-gray-400"}
          >
            Testcase
          </button>

          <button
            onClick={() => setActiveTab("result")}
            className={activeTab === "result" ? "text-green-400" : "text-gray-400"}
          >
            Test Result
          </button>
        </div>

        {/* CONTENT */}
        <div className="flex-1 p-3 overflow-auto">

          {/* TESTCASE UI */}
          {activeTab === "testcase" && (
            <div className="flex flex-col gap-4">

              {/* Case Tabs */}
              <div className="flex gap-2">
                {testcases.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveCase(i)}
                    className={`px-3 py-1 rounded ${
                      activeCase === i
                        ? "bg-gray-700 text-white"
                        : "bg-gray-800 text-gray-400"
                    }`}
                  >
                    Case {i + 1}
                  </button>
                ))}

                <button
                  onClick={() => {
                    setTestcases([
                      ...testcases,
                      { nums: "", target: "" }
                    ]);
                    setActiveCase(testcases.length);
                  }}
                  className="px-3 py-1 bg-gray-800 text-gray-400 rounded"
                >
                  +
                </button>
              </div>

              {/* nums */}
              <div>
                <label className="text-sm text-gray-400">nums =</label>
                <input
                  value={testcases[activeCase].nums}
                  onChange={(e) => {
                    const updated = [...testcases];
                    updated[activeCase].nums = e.target.value;
                    setTestcases(updated);
                  }}
                  className="w-full bg-gray-800 p-2 rounded mt-1"
                />
              </div>

              {/* target */}
              <div>
                <label className="text-sm text-gray-400">target =</label>
                <input
                  value={testcases[activeCase].target}
                  onChange={(e) => {
                    const updated = [...testcases];
                    updated[activeCase].target = e.target.value;
                    setTestcases(updated);
                  }}
                  className="w-full bg-gray-800 p-2 rounded mt-1"
                />
              </div>
            </div>
          )}

          {/* RESULT */}
          {activeTab === "result" && (
            <pre className="bg-black p-3 rounded text-sm h-full whitespace-pre-wrap">
              {output}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
};

export default CodeEditor;