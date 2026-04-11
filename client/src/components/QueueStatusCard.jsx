function QueueStatusCard({ queueState, onFindMatch, onCancel }) {
  return (
    <div className="arena-panel p-8">
      <div className="mb-4 inline-flex rounded-full border border-flame-400/25 bg-flame-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-flame-400">
        Matchmaking
      </div>
      <h2 className="text-3xl font-bold">Ready for your next duel?</h2>
      <p className="mt-3 max-w-2xl text-paper-200/65">
        Join the live queue, get paired with another player instantly, and race to clear the same hidden test suite first.
      </p>

      <div className="mt-6 flex flex-wrap gap-4">
        <button className="arena-button-primary" onClick={onFindMatch} disabled={queueState.searching}>
          {queueState.searching ? "Searching for opponent..." : "Find Match"}
        </button>
        <button className="arena-button-secondary" onClick={onCancel} disabled={!queueState.searching}>
          Leave Queue
        </button>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-arena-900/70 p-4">
          <div className="text-sm text-paper-200/55">Queue status</div>
          <div className="mt-2 text-xl font-semibold">{queueState.searching ? "In queue" : "Idle"}</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-arena-900/70 p-4">
          <div className="text-sm text-paper-200/55">Players waiting</div>
          <div className="mt-2 text-xl font-semibold">{queueState.queueSize ?? "--"}</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-arena-900/70 p-4">
          <div className="text-sm text-paper-200/55">Message</div>
          <div className="mt-2 text-xl font-semibold">{queueState.message || "Queue up to begin."}</div>
        </div>
      </div>
    </div>
  );
}

export default QueueStatusCard;
