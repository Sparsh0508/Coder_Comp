import Editor from "@monaco-editor/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Columns2, Expand, Minimize2, Moon, Rows3, Sun, Type } from "lucide-react";

const languageMap = {
  cpp: "cpp",
  java: "java",
  python: "python",
};

const STORAGE_KEY = "arena_editor_settings";

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
  const [isOutputCollapsed, setIsOutputCollapsed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [themeMode, setThemeMode] = useState("dark");
  const [fontSize, setFontSize] = useState(14);
  const [outputHeight, setOutputHeight] = useState(220);
  const [layoutMode, setLayoutMode] = useState("stacked");
  const [splitRatio, setSplitRatio] = useState(0.62);
  const [isNarrow, setIsNarrow] = useState(false);
  const [isDragResizing, setIsDragResizing] = useState(false);
  const [isSplitDragging, setIsSplitDragging] = useState(false);
  const dragStartRef = useRef({ startY: 0, startHeight: 0 });
  const splitStartRef = useRef({ startX: 0, startRatio: 0 });
  const splitContainerRef = useRef(null);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return;
    }

    try {
      const parsed = JSON.parse(stored);
      if (parsed.fontSize) setFontSize(parsed.fontSize);
      if (parsed.themeMode) setThemeMode(parsed.themeMode);
      if (parsed.outputHeight) setOutputHeight(parsed.outputHeight);
      if (parsed.layoutMode) setLayoutMode(parsed.layoutMode);
      if (parsed.splitRatio) setSplitRatio(parsed.splitRatio);
    } catch {}
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ fontSize, themeMode, outputHeight, layoutMode, splitRatio })
    );
  }, [fontSize, themeMode, outputHeight, layoutMode, splitRatio]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 1024px)");
    const handleResize = () => {
      setIsNarrow(mediaQuery.matches);
      if (mediaQuery.matches) {
        setLayoutMode("stacked");
      }
    };

    handleResize();
    mediaQuery.addEventListener("change", handleResize);

    return () => mediaQuery.removeEventListener("change", handleResize);
  }, []);

  useEffect(() => {
    if (!isDragResizing) return;

    const handleMouseMove = (event) => {
      const delta = dragStartRef.current.startY - event.clientY;
      setOutputHeight(Math.min(360, Math.max(140, dragStartRef.current.startHeight + delta)));
    };

    const handleMouseUp = () => setIsDragResizing(false);

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragResizing]);

  useEffect(() => {
    if (!isSplitDragging) return;

    const handleMouseMove = (event) => {
      const container = splitContainerRef.current;
      if (!container) return;
      const bounds = container.getBoundingClientRect();
      const delta = event.clientX - splitStartRef.current.startX;
      const nextRatio = splitStartRef.current.startRatio + delta / bounds.width;
      setSplitRatio(Math.min(0.75, Math.max(0.45, nextRatio)));
    };

    const handleMouseUp = () => setIsSplitDragging(false);

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isSplitDragging]);

  const editorTheme = themeMode === "dark" ? "vs-dark" : "light";
  const outputStyle = useMemo(
    () => ({
      height: isOutputCollapsed ? 0 : `${outputHeight}px`,
    }),
    [isOutputCollapsed, outputHeight]
  );
  const isSplitLayout = layoutMode === "split";

  return (
    <section
      className={`arena-panel flex h-full flex-col overflow-hidden ${
        isFullscreen ? "fixed inset-4 z-50 h-[calc(100vh-2rem)]" : ""
      }`}
    >
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
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-arena-900/75 px-2 py-1">
            <button
              className="rounded-full px-2 py-1 text-xs text-paper-100 hover:bg-white/10"
              onClick={() => setFontSize((value) => Math.max(12, value - 1))}
            >
              A-
            </button>
            <div className="text-xs text-paper-200/60">Font {fontSize}</div>
            <button
              className="rounded-full px-2 py-1 text-xs text-paper-100 hover:bg-white/10"
              onClick={() => setFontSize((value) => Math.min(20, value + 1))}
            >
              A+
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            className="arena-button-secondary gap-2 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={() => setLayoutMode(isSplitLayout ? "stacked" : "split")}
            disabled={isNarrow}
          >
            {isSplitLayout ? <Rows3 size={16} /> : <Columns2 size={16} />}
            {isSplitLayout ? "Stacked" : "Split"}
          </button>
          <button className="arena-button-secondary gap-2" onClick={() => setThemeMode(themeMode === "dark" ? "light" : "dark")}>
            {themeMode === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            {themeMode === "dark" ? "Light" : "Dark"}
          </button>
          <button className="arena-button-secondary gap-2" onClick={() => setIsOutputCollapsed((value) => !value)}>
            <Type size={16} />
            {isOutputCollapsed ? "Show Output" : "Hide Output"}
          </button>
          <button className="arena-button-secondary gap-2" onClick={() => setIsFullscreen((value) => !value)}>
            {isFullscreen ? <Minimize2 size={16} /> : <Expand size={16} />}
            {isFullscreen ? "Exit" : "Fullscreen"}
          </button>
          <button className="arena-button-secondary" onClick={onRun} disabled={running || submitting}>
            {running ? "Running..." : "Run"}
          </button>
          <button className="arena-button-primary" onClick={onSubmit} disabled={running || submitting}>
            {submitting ? "Submitting..." : "Submit"}
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        {isSplitLayout ? (
          <div
            ref={splitContainerRef}
            className="grid min-h-0 flex-1"
            style={{
              gridTemplateColumns: isOutputCollapsed
                ? "1fr"
                : `${Math.round(splitRatio * 100)}% 12px ${Math.round((1 - splitRatio) * 100)}%`,
            }}
          >
            <div className="min-h-0">
              <Editor
                language={languageMap[language]}
                value={code}
                onChange={(value) => onChange(value || "")}
                theme={editorTheme}
                options={{
                  fontSize,
                  minimap: { enabled: false },
                  fontFamily: "JetBrains Mono, monospace",
                  padding: { top: 16 },
                  automaticLayout: true,
                  smoothScrolling: true,
                  scrollBeyondLastLine: false,
                }}
              />
            </div>
            {!isOutputCollapsed ? (
              <div
                className={`flex cursor-col-resize items-center justify-center bg-white/5 ${
                  isSplitDragging ? "bg-arena-500/20" : ""
                }`}
                onMouseDown={(event) => {
                  splitStartRef.current.startX = event.clientX;
                  splitStartRef.current.startRatio = splitRatio;
                  setIsSplitDragging(true);
                }}
              >
                <span className="text-[10px] uppercase tracking-[0.3em] text-paper-200/50">drag</span>
              </div>
            ) : null}
            {!isOutputCollapsed ? (
              <div className="flex min-h-0 flex-col border-l border-white/10 bg-arena-900/70 p-5">
                <div className="mb-3 text-xs uppercase tracking-[0.22em] text-paper-200/45">Output</div>
                <pre className="flex-1 overflow-auto whitespace-pre-wrap rounded-2xl bg-black/20 p-4 font-mono text-xs text-paper-100 scroll-smooth">
                  {output || "Run your code to see test execution details."}
                </pre>
                <div className="mt-3 flex items-center justify-between text-xs text-paper-200/60">
                  <span>Drag divider to resize</span>
                  <input
                    type="range"
                    min="45"
                    max="75"
                    value={Math.round(splitRatio * 100)}
                    onChange={(event) => setSplitRatio(Number(event.target.value) / 100)}
                    className="w-40 accent-arena-500"
                  />
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <>
            <div className="min-h-0 flex-1">
              <Editor
                language={languageMap[language]}
                value={code}
                onChange={(value) => onChange(value || "")}
                theme={editorTheme}
                options={{
                  fontSize,
                  minimap: { enabled: false },
                  fontFamily: "JetBrains Mono, monospace",
                  padding: { top: 16 },
                  automaticLayout: true,
                  smoothScrolling: true,
                  scrollBeyondLastLine: false,
                }}
              />
            </div>

            <div
              className={`border-t border-white/10 bg-arena-900/70 ${isOutputCollapsed ? "p-0" : "p-5"} overflow-hidden`}
              style={outputStyle}
            >
              {!isOutputCollapsed ? (
                <div
                  className={`-mt-5 mb-4 flex h-5 cursor-row-resize items-center justify-center rounded-full bg-white/5 text-[10px] uppercase tracking-[0.3em] text-paper-200/50 ${
                    isDragResizing ? "bg-arena-500/20 text-arena-300" : ""
                  }`}
                  onMouseDown={(event) => {
                    dragStartRef.current.startY = event.clientY;
                    dragStartRef.current.startHeight = outputHeight;
                    setIsDragResizing(true);
                  }}
                >
                  drag output
                </div>
              ) : null}
              <div className={`${isOutputCollapsed ? "hidden" : "block"}`}>
                <div className="mb-3 text-xs uppercase tracking-[0.22em] text-paper-200/45">Output</div>
                <pre className="max-h-56 overflow-auto whitespace-pre-wrap rounded-2xl bg-black/20 p-4 font-mono text-xs text-paper-100 scroll-smooth">
                  {output || "Run your code to see test execution details."}
                </pre>
              </div>
              {!isOutputCollapsed ? (
                <div className="mt-3 flex items-center justify-between text-xs text-paper-200/60">
                  <span>Drag to resize output</span>
                  <input
                    type="range"
                    min="140"
                    max="360"
                    value={outputHeight}
                    onChange={(event) => setOutputHeight(Number(event.target.value))}
                    className="w-40 accent-arena-500"
                  />
                </div>
              ) : null}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

export default EditorPanel;
