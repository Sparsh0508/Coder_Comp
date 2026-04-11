import Editor from "@monaco-editor/react";

const languageMap = {
  cpp: "cpp",
  java: "java",
  python: "python",
};

function EditorPanel({
  language,
  code,
  onChange,
  onLanguageChange,
  onRun,
  onSubmit,
  running,
  submitting,
  output,
  timer,
}) {
  return (
    <section className="arena-panel flex h-full flex-col overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 px-5 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <select className="arena-input min-w-36 py-2" value={language} onChange={(event) => onLanguageChange(event.target.value)}>
            <option value="cpp">C++</option>
            <option value="java">Java</option>
            <option value="python">Python</option>
          </select>
          <div className="rounded-full border border-white/10 bg-arena-900/75 px-3 py-2 font-mono text-sm text-paper-100">
            {timer}
          </div>
        </div>

        <div className="flex gap-3">
          <button className="arena-button-secondary" onClick={onRun} disabled={running || submitting}>
            {running ? "Running..." : "Run"}
          </button>
          <button className="arena-button-primary" onClick={onSubmit} disabled={running || submitting}>
            {submitting ? "Submitting..." : "Submit"}
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1">
        <Editor
          language={languageMap[language]}
          value={code}
          onChange={(value) => onChange(value || "")}
          theme="vs-dark"
          options={{
            fontSize: 14,
            minimap: { enabled: false },
            fontFamily: "JetBrains Mono, monospace",
            padding: { top: 16 },
            automaticLayout: true,
          }}
        />
      </div>

      <div className="border-t border-white/10 bg-arena-900/70 p-5">
        <div className="mb-3 text-xs uppercase tracking-[0.22em] text-paper-200/45">Output</div>
        <pre className="max-h-56 overflow-auto whitespace-pre-wrap rounded-2xl bg-black/20 p-4 font-mono text-xs text-paper-100">
          {output || "Run your code to see test execution details."}
        </pre>
      </div>
    </section>
  );
}

export default EditorPanel;
