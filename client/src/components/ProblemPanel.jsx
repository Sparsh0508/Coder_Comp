function ProblemPanel({ problem }) {
  const getDifficultyColor = (diff) => {
    switch(diff?.toLowerCase()) {
      case 'easy': return 'text-arena-400 border-arena-500/30 bg-arena-500/10';
      case 'medium': return 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10';
      case 'hard': return 'text-flame-400 border-flame-500/30 bg-flame-500/10';
      default: return 'text-arena-400 border-arena-500/30 bg-arena-500/10';
    }
  };

  return (
    <section className="arena-panel flex h-full flex-col overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-arena-500/50 to-transparent opacity-50" />
      <div className="border-b border-white/10 px-6 py-5 bg-white/5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.28em] text-paper-200/50">Problem</div>
            <h2 className="mt-2 text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-paper-200/50">{problem?.title}</h2>
          </div>
          <div className={`rounded-xl border px-3 py-1 text-sm font-semibold uppercase tracking-wider shadow-[0_0_10px_rgba(0,0,0,0.2)] ${getDifficultyColor(problem?.difficulty)}`}>
            {problem?.difficulty || "UNKNOWN"}
          </div>
        </div>
      </div>

      <div className="space-y-8 overflow-y-auto px-6 py-8 text-sm leading-7 text-paper-200/85">
        <div>
          <h3 className="mb-3 text-lg font-bold text-white flex items-center gap-2">
            <span className="w-1 h-5 bg-arena-500 rounded-full" />
            Description
          </h3>
          <p className="text-paper-100">{problem?.description}</p>
        </div>

        <div>
           <h3 className="mb-3 text-lg font-bold text-white flex items-center gap-2">
            <span className="w-1 h-5 bg-yellow-500 rounded-full" />
            Constraints
          </h3>
          <ul className="space-y-2">
            {problem?.constraints?.map((constraint) => (
              <li key={constraint} className="rounded-xl border border-white/10 bg-black/20 px-4 py-2 font-mono text-xs shadow-inner">
                {constraint}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-lg font-bold text-white flex items-center gap-2">
            <span className="w-1 h-5 bg-flame-500 rounded-full" />
            Sample Test Cases
          </h3>
          <div className="space-y-4">
            {problem?.sampleTestCases?.map((testCase, index) => (
              <div key={`${testCase.input}-${index}`} className="rounded-2xl border border-white/10 bg-black/20 p-5 shadow-inner">
                <div className="mb-4 inline-flex px-2 py-1 bg-white/5 rounded text-xs uppercase tracking-[0.22em] text-paper-200/60 font-bold">Sample {index + 1}</div>
                <div className="grid gap-4">
                  <div>
                    <div className="mb-1 text-[10px] uppercase tracking-widest text-paper-200/50">Input</div>
                    <pre className="overflow-x-auto rounded-xl border border-white/5 bg-black/40 p-3 font-mono text-xs text-arena-400">{testCase.input}</pre>
                  </div>
                  <div>
                    <div className="mb-1 text-[10px] uppercase tracking-widest text-paper-200/50">Output</div>
                    <pre className="overflow-x-auto rounded-xl border border-white/5 bg-black/40 p-3 font-mono text-xs text-flame-400">{testCase.output}</pre>
                  </div>
                  {testCase.explanation ? <p className="text-sm text-paper-200/50 italic border-l-2 border-white/10 pl-3 mt-2">{testCase.explanation}</p> : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default ProblemPanel;
