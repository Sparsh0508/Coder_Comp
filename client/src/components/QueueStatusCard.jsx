const matchModes = [
  { value: "1v1", label: "1v1", description: "Classic duel" },
  { value: "2v2", label: "2v2", description: "Small team battle" },
  { value: "4v4", label: "4v4", description: "Full squad clash" },
];

function QueueStatusCard({ queueState, selectedMode, entryCoins, onModeChange, onFindMatch, onCancel, activeMatch }) {
  const hasActiveMatch = Boolean(activeMatch?.matchId);

  return (
    <div className="arena-panel p-8">
      <div className="mb-4 inline-flex rounded-full border border-flame-400/25 bg-flame-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-flame-400">
        Matchmaking
      </div>
      <h2 className="text-3xl font-bold">Ready for your next duel?</h2>
      <p className="mt-3 max-w-2xl text-paper-200/65">
        Join the live queue, get paired with another player instantly, and race to clear the same hidden test suite first.
      </p>

      <div className="mt-6 grid gap-3 md:grid-cols-3">
        {matchModes.map((mode) => {
          const isActive = selectedMode === mode.value;

          return (
            <button
              key={mode.value}
              type="button"
              onClick={() => onModeChange(mode.value)}
              disabled={queueState.searching || hasActiveMatch}
              className={`rounded-2xl border p-4 text-left transition ${
                isActive
                  ? "border-arena-500/60 bg-arena-500/10"
                  : "border-white/10 bg-arena-900/60 hover:border-white/20"
              } ${queueState.searching ? "opacity-70" : ""}`}
            >
              <div className="text-lg font-semibold">{mode.label}</div>
              <div className="mt-1 text-sm text-paper-200/60">{mode.description}</div>
            </button>
          );
        })}
      </div>

      <div className="mt-6 flex flex-wrap gap-4">
        <button className="arena-button-primary" onClick={onFindMatch} disabled={queueState.searching}>
          {hasActiveMatch
            ? "Resume Active Match"
            : queueState.searching
              ? `Searching ${selectedMode}...`
              : `Find ${selectedMode} Match`}
        </button>
        <button className="arena-button-secondary" onClick={onCancel} disabled={!queueState.searching}>
          Leave Queue
        </button>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-arena-900/70 p-4">
          <div className="text-sm text-paper-200/55">Queue status</div>
          <div className="mt-2 text-xl font-semibold">{hasActiveMatch ? "In match" : queueState.searching ? "In queue" : "Idle"}</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-arena-900/70 p-4">
          <div className="text-sm text-paper-200/55">Mode / waiting</div>
          <div className="mt-2 text-xl font-semibold">
            {selectedMode} / {queueState.queueSize ?? 0}
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-arena-900/70 p-4">
          <div className="text-sm text-paper-200/55">Entry / needed</div>
          <div className="mt-2 text-xl font-semibold">
            {entryCoins} / {queueState.requiredPlayers ?? (selectedMode === "1v1" ? 2 : selectedMode === "2v2" ? 4 : 8)}
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-arena-900/70 p-4">
          <div className="text-sm text-paper-200/55">Spots left</div>
          <div className="mt-2 text-xl font-semibold">{queueState.spotsLeft ?? "--"}</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-arena-900/70 p-4">
          <div className="text-sm text-paper-200/55">Message</div>
          <div className="mt-2 text-base font-semibold">
            {hasActiveMatch
              ? `You already have a ${activeMatch.status} match in progress.`
              : queueState.message || "Queue up to begin."}
          </div>
        </div>
      </div>
    </div>
  );
}

export default QueueStatusCard;
