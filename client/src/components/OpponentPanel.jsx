function renderPlayerBadge(player, tone) {
  return (
    <div key={player.id} className="rounded-2xl border border-white/10 bg-black/15 p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="font-semibold">{player.username}</div>
          <div className="text-sm text-paper-200/60">Rating {player.rating}</div>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs ${
            tone === "ally" ? "bg-arena-500/10 text-arena-400" : "bg-flame-500/10 text-flame-400"
          }`}
        >
          {player.status || "coding"}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-paper-100">
          {player.passedTests ?? 0}/{player.totalTests ?? 0} tests
        </span>
        <span
          className={`rounded-full border px-3 py-1 ${
            tone === "ally"
              ? "border-arena-500/30 bg-arena-500/10 text-arena-400"
              : "border-flame-400/30 bg-flame-500/10 text-flame-400"
          }`}
        >
          {player.isTyping ? "Typing..." : player.hasSubmitted ? "Submitted" : "Watching"}
        </span>
      </div>
    </div>
  );
}

function OpponentPanel({ mode, teammates, opponents, currentPlayer, queueMessage }) {
  return (
    <div className="grid gap-4 xl:grid-cols-[1.1fr_1fr]">
      <div className="arena-panel p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs uppercase tracking-[0.25em] text-paper-200/45">Your Team</div>
          <div className="rounded-full border border-arena-500/30 bg-arena-500/10 px-3 py-1 text-xs text-arena-400">
            {mode}
          </div>
        </div>
        <div className="mt-4 space-y-3">
          {currentPlayer ? renderPlayerBadge(currentPlayer, "ally") : null}
          {teammates?.length ? teammates.map((player) => renderPlayerBadge(player, "ally")) : null}
          {!teammates?.length ? (
            <div className="rounded-2xl border border-white/10 bg-black/15 p-3 text-sm text-paper-200/60">
              Solo lane active. No teammates in this mode.
            </div>
          ) : null}
        </div>
      </div>

      <div className="arena-panel p-5">
        <div className="text-xs uppercase tracking-[0.25em] text-paper-200/45">Opposing Team</div>
        <div className="mt-4 space-y-3">
          {opponents?.length ? (
            opponents.map((player) => renderPlayerBadge(player, "enemy"))
          ) : (
            <div className="rounded-2xl border border-white/10 bg-black/15 p-3 text-sm text-paper-200/60">
              {queueMessage || "Waiting for the opposing team."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default OpponentPanel;
