function ProblemPanel({ problem }) {
  return (
    <section className="arena-panel flex h-full flex-col overflow-hidden">
      <div className="border-b border-white/10 px-6 py-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.28em] text-paper-200/50">Problem</div>
            <h2 className="mt-2 text-2xl font-bold">{problem?.title}</h2>
          </div>
          <div className="rounded-full border border-arena-500/25 bg-arena-500/10 px-3 py-1 text-sm font-semibold text-arena-400">
            {problem?.difficulty}
          </div>
        </div>
      </div>

      <div className="space-y-6 overflow-y-auto px-6 py-5 text-sm leading-7 text-paper-200/85">
        <div>
          <h3 className="mb-2 text-lg font-semibold text-paper-100">Description</h3>
          <p>{problem?.description}</p>
        </div>

        <div>
          <h3 className="mb-2 text-lg font-semibold text-paper-100">Constraints</h3>
          <ul className="space-y-2">
            {problem?.constraints?.map((constraint) => (
              <li key={constraint} className="rounded-2xl border border-white/10 bg-arena-900/70 px-4 py-2">
                {constraint}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-2 text-lg font-semibold text-paper-100">Sample Test Cases</h3>
          <div className="space-y-4">
            {problem?.sampleTestCases?.map((testCase, index) => (
              <div key={`${testCase.input}-${index}`} className="rounded-2xl border border-white/10 bg-arena-900/70 p-4">
                <div className="mb-3 text-xs uppercase tracking-[0.22em] text-paper-200/45">Sample {index + 1}</div>
                <div className="grid gap-3">
                  <div>
                    <div className="mb-1 text-xs text-paper-200/50">Input</div>
                    <pre className="overflow-x-auto rounded-xl bg-black/20 p-3 font-mono text-xs text-arena-400">{testCase.input}</pre>
                  </div>
                  <div>
                    <div className="mb-1 text-xs text-paper-200/50">Output</div>
                    <pre className="overflow-x-auto rounded-xl bg-black/20 p-3 font-mono text-xs text-flame-400">{testCase.output}</pre>
                  </div>
                  {testCase.explanation ? <p className="text-paper-200/65">{testCase.explanation}</p> : null}
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
