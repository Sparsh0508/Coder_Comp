import { useState, useRef, useEffect } from "react";
import Prism from "prismjs";
import "prismjs/components/index";
import "prismjs/themes/prism-tomorrow.css";
import { socket } from "../socket";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
const RUNNER_URL ="https://coder-comp-jxv5.onrender.com";

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
const { user } = useAuth();
  // 🔥 Structured Testcases
  const [testcases, setTestcases] = useState([
    { nums: "[2,7,11,15]", target: "9" }
  ]);
  const [activeCase, setActiveCase] = useState(0);
  const [testResults, setTestResults] = useState([]);

  const codeRef = useRef(null);
  const textareaRef = useRef(null);

  const langMap = {
    javascript: "javascript",
    python: "python",
    cpp: "cpp",
    java: "java"
  };
  useEffect(() => {
    if (codeRef.current) {
      const lang = langMap[language] || "javascript";
      const grammar = Prism.languages[lang] || Prism.languages.javascript;
      codeRef.current.innerHTML = Prism.highlight(code, grammar, lang);
    }
  }, [code, language]);
  useEffect(() => {
    setSavedCodes((prev) => ({
      ...prev,
      [language]: code
    }));
  }, [code]);

  useEffect(() => {
    setCode(savedCodes[language] || boilerplates[language]);
  }, [language]);

  useEffect(() => {
  socket.on("match_result", ({ winner }) => {
    console.log("🏆 WINNER:", winner);

    if (winner === user?.id) {
      alert("🎉 You Won!");
    } else {
      alert("😢 You Lost!");
    }

    navigate("/dashboard"); 
  });

  return () => {
    socket.off("match_result");
  };
}, []);
 
  const handleChange = (e) => {
    const value = e.target.value;
    setCode(value);

    const cursorPos = e.target.selectionStart;
    const lines = value.substr(0, cursorPos).split("\n").length;
    setActiveLine(lines);
  };

 
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

  const handleScroll = (e) => {
    if (codeRef.current) {
      codeRef.current.scrollTop = e.target.scrollTop;
      codeRef.current.scrollLeft = e.target.scrollLeft;
    }
  };

 
  const runCode = async () => {
    setLoadingRun(true);
    setOutput("⚡ Running...");
    setActiveTab("result");

    try {
      const res = await fetch(`${RUNNER_URL}/api/execute`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          code,
          language,
          inputs: testcases 
        })
      });

      const data = await res.json();
      console.log("Run response:", data);
      
      if (data.results) {
        setTestResults(data.results);
        setActiveCase(0);
        setOutput(data.status === "Success" ? "⚡ Run Finished" : "❌ Error");
      } else {
        setOutput(data.output || data.error || "No output");
      }
    } catch (err) {
      console.error(err);
      setOutput("❌ Server Error");
    }

    setLoadingRun(false);
  };
  const submitCode = async () => {
    setLoadingSubmit(true);
    setOutput("🚀 Submitting...");
    setActiveTab("result");

    try {
      const res = await fetch(`${RUNNER_URL}/api/submit`, {
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
      setTestResults(data.results || []);
      setActiveCase(0);

      if (data.status === "Accepted") {
        setOutput(" Accepted 🎉");
        socket.emit("submit_success", {
          matchId: id,
          userId: user?.id
        });
      } else {
        setOutput(`❌ ${data.status}`);
      }
    } catch (err) {
      console.error(err);
      setOutput("❌ Server Error");
    }

    setLoadingSubmit(false);
  };

  return (
    <div className="bg-[#0f172a] text-white rounded-lg border border-gray-700 h-full flex flex-col">

   
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

      <div className="flex flex-[2] border-b border-gray-700">

        <div className="bg-[#020617] text-gray-500 text-sm px-2 py-2 select-none">
          {code.split("\n").map((_, i) => (
            <div key={i} className={activeLine === i + 1 ? "text-white" : ""}>
              {i + 1}
            </div>
          ))}
        </div>

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
      <div className="flex flex-col flex-1 bg-[#0b1220]">

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

       
        <div className="flex-1 p-3 overflow-auto">

          {activeTab === "testcase" && (
            <div className="flex flex-col gap-4">

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

       
          {activeTab === "result" && (
            <div className="flex flex-col gap-4 h-full">
             
              <div className={`p-3 rounded-lg border ${
                testResults.every(r => r.verdict === 'Accepted') 
                ? 'bg-green-500/10 border-green-500/30 text-green-400' 
                : 'bg-red-500/10 border-red-500/30 text-red-400'
              }`}>
                <h2 className="text-lg font-bold flex items-center gap-2">
                  {testResults.length === 0 ? "No Results Yet" : 
                   testResults.every(r => r.verdict === 'Accepted') ? "✅ Accepted" : "❌ Wrong Answer"}
                </h2>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1">
                {testResults.map((r, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveCase(i)}
                    className={`flex flex-col items-start px-4 py-2 rounded-lg border transition-all min-w-[100px] ${
                      activeCase === i 
                      ? 'bg-gray-700/50 border-gray-500 ring-1 ring-gray-400' 
                      : 'bg-gray-800/30 border-gray-700 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <span className="text-xs text-gray-400">Case {r.case}</span>
                    <span className={`text-sm font-bold ${
                      r.verdict === 'Accepted' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {r.verdict === 'Accepted' ? 'Passed' : 'Failed'}
                    </span>
                  </button>
                ))}
              </div>

              {testResults[activeCase] && (
                <div className="flex-1 bg-black/40 rounded-xl p-4 border border-white/5 overflow-auto animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="space-y-4 font-mono text-sm">
                    <div>
                      <p className="text-gray-500 mb-1 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span> Input
                      </p>
                      <pre className="bg-white/5 p-3 rounded-lg text-gray-200">
                        {typeof testResults[activeCase].input === 'object' 
                         ? JSON.stringify(testResults[activeCase].input) 
                         : String(testResults[activeCase].input)}
                      </pre>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-gray-500 mb-1 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span> Expected
                        </p>
                        <pre className="bg-green-400/5 p-3 rounded-lg text-green-200/80 border border-green-500/10">
                          {testResults[activeCase].expected}
                        </pre>
                      </div>

                      <div>
                        <p className="text-gray-500 mb-1 flex items-center gap-2">
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            testResults[activeCase].verdict === 'Accepted' ? 'bg-green-400' : 'bg-red-400'
                          }`}></span> Output
                        </p>
                        <pre className={`p-3 rounded-lg border ${
                          testResults[activeCase].verdict === 'Accepted' 
                          ? 'bg-green-400/5 text-green-200/80 border-green-500/10' 
                          : 'bg-red-400/5 text-red-200 border-red-500/10'
                        }`}>
                          {testResults[activeCase].output || "No output"}
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {!testResults[activeCase] && output && (
                <pre className="bg-black/40 p-4 rounded-xl text-sm h-full whitespace-pre-wrap border border-white/5 font-mono text-gray-300">
                  {output}
                </pre>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CodeEditor;
