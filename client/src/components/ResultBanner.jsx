function ResultBanner({ result, userId }) {
  if (!result) {
    return null;
  }

  const hasWon = result.winnerId === userId;

  return (
    <div
      className={`fixed inset-x-4 top-4 z-50 mx-auto max-w-3xl rounded-3xl border px-6 py-4 shadow-2xl backdrop-blur-xl ${
        hasWon
          ? "border-arena-500/40 bg-arena-500/12 text-paper-100"
          : "border-flame-400/35 bg-flame-500/12 text-paper-100"
      }`}
    >
      <div className="text-xs uppercase tracking-[0.25em] text-paper-200/55">Match Complete</div>
      <div className="mt-2 text-2xl font-bold">{hasWon ? "Victory secured" : "Defeat this round"}</div>
      <p className="mt-2 text-paper-200/75">
        {result.reason || (hasWon ? "You cleared the full test suite first." : "Your opponent finished first.")}
      </p>
    </div>
  );
}

export default ResultBanner;
