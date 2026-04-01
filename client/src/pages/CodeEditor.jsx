import { useState, useRef, useEffect } from "react";
import Prism from "prismjs";
import "prismjs/components/index";
import "prismjs/themes/prism-tomorrow.css";

const CodeEditor = () => {
  const [code, setCode] = useState("// Write your code here...");
  const [language, setLanguage] = useState("javascript");
  const [output, setOutput] = useState("Run your code...");
  const [activeLine, setActiveLine] = useState(1);

  // 🔥 Separate loading states
  const [loadingRun, setLoadingRun] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);

  // 🔥 Tabs + Testcases
  const [activeTab, setActiveTab] = useState("testcase");
  const [testcases, setTestcases] = useState([""]);
  const [activeCase, setActiveCase] = useState(0);

  const codeRef = useRef(null);
  const textareaRef = useRef(null);

  const langMap = {
    javascript: "javascript",
    python: "python",
    cpp: "cpp",
    java: "java"
  };

  // 🔥 Syntax Highlight
  useEffect(() => {
    if (codeRef.current) {
      const lang = langMap[language] || "javascript";
      const grammar = Prism.languages[lang] || Prism.languages.javascript;
      codeRef.current.innerHTML = Prism.highlight(code, grammar, lang);
    }
  }, [code, language]);

  // 🔥 Handle typing
  const handleChange = (e) => {
    const value = e.target.value;
    setCode(value);

    const cursorPos = e.target.selectionStart;
    const lines = value.substr(0, cursorPos).split("\n").length;
    setActiveLine(lines);
  };

  // 🔥 TAB + RUN shortcut
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

  // ▶ RUN CODE
  const runCode = async () => {
    setLoadingRun(true);
    setOutput("⚡ Running...");
    setActiveTab("result");

    try {
      const res = await fetch("http://localhost:5001/api/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          code,
          language,
          input: testcases[activeCase]
        })
      });

      const data = await res.json();
      setOutput(data.output || "No output");

    } catch {
      setOutput("❌ Server Error");
    }

    setLoadingRun(false);
  };

  // 🚀 SUBMIT CODE
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
        body: JSON.stringify({ code, language })
      });

      const data = await res.json();

      if (data.status === "Accepted") {
        setOutput("✅ Accepted 🎉");
      } 
      else if (data.status === "Wrong Answer") {
        setOutput(
          `❌ Wrong Answer\n\nTestcase: ${data.failedCase}\nExpected: ${data.expected}\nGot: ${data.got}`
        );
      } 
      else if (data.status === "TLE") {
        setOutput("⏱ Time Limit Exceeded");
      } 
      else {
        setOutput(`⚠️ ${data.status}`);
      }

    } catch {
      setOutput("❌ Server Error");
    }

    setLoadingSubmit(false);
  };

  return (
    <div className="bg-[#0f172a] text-white rounded-lg border border-gray-700 h-full flex flex-col">

      {/* 🔝 HEADER */}
      <div className="flex justify-between items-center px-4 py-2 bg-[#020617] border-b border-gray-700">

        {/* Language */}
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

        {/* Buttons */}
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

      {/* 💻 MAIN */}
      <div className="flex flex-col flex-1">

        {/* 🧠 EDITOR */}
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

        {/* 📤 TESTCASE PANEL */}
        <div className="flex flex-col flex-1 bg-[#0b1220]">

          {/* Tabs */}
          <div className="flex gap-4 px-3 py-2 border-b border-gray-700 text-sm">
            <button
              onClick={() => setActiveTab("testcase")}
              className={`pb-1 ${
                activeTab === "testcase"
                  ? "text-green-400 border-b border-green-400"
                  : "text-gray-400"
              }`}
            >
              Testcase
            </button>

            <button
              onClick={() => setActiveTab("result")}
              className={`pb-1 ${
                activeTab === "result"
                  ? "text-green-400 border-b border-green-400"
                  : "text-gray-400"
              }`}
            >
              Test Result
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 p-3 overflow-auto">

            {/* TESTCASE */}
            {activeTab === "testcase" && (
              <div className="flex flex-col h-full">

                {/* Cases */}
                <div className="flex gap-2 mb-3">
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
                      setTestcases([...testcases, ""]);
                      setActiveCase(testcases.length);
                    }}
                    className="px-3 py-1 bg-gray-800 text-gray-400 rounded"
                  >
                    +
                  </button>
                </div>

                {/* Input */}
                <textarea
                  value={testcases[activeCase]}
                  onChange={(e) => {
                    const updated = [...testcases];
                    updated[activeCase] = e.target.value;
                    setTestcases(updated);
                  }}
                  className="w-full flex-1 bg-gray-800 p-2 rounded text-sm outline-none"
                  placeholder="Enter input..."
                />
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
    </div>
  );
};

export default CodeEditor;