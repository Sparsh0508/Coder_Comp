function OpponentPanel({ opponent, currentPlayer, queueMessage }) {
  return (
    <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
      <div className="arena-panel p-5">
        <div className="text-xs uppercase tracking-[0.25em] text-paper-200/45">You</div>
        <div className="mt-2 text-xl font-semibold">{currentPlayer?.username}</div>
        <div className="mt-1 text-sm text-paper-200/60">Rating {currentPlayer?.rating}</div>
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full border border-arena-500/30 bg-arena-500/10 px-3 py-1 text-arena-400">
            {currentPlayer?.passedTests ?? 0}/{currentPlayer?.totalTests ?? 0} tests
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-paper-100">
            {currentPlayer?.status || "coding"}
          </span>
        </div>
      </div>

      <div className="arena-panel p-5">
        <div className="text-xs uppercase tracking-[0.25em] text-paper-200/45">Opponent</div>
        <div className="mt-2 text-xl font-semibold">{opponent?.username || "Searching..."}</div>
        <div className="mt-1 text-sm text-paper-200/60">
          {opponent ? `Rating ${opponent.rating}` : queueMessage || "Waiting in queue"}
        </div>
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full border border-flame-400/30 bg-flame-500/10 px-3 py-1 text-flame-400">
            {opponent?.isTyping ? "Typing..." : opponent?.hasSubmitted ? "Submitted" : "Watching"}
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-paper-100">
            {opponent?.passedTests ?? 0}/{opponent?.totalTests ?? 0} tests
          </span>
        </div>
      </div>
    </div>
  );
}

export default OpponentPanel;
