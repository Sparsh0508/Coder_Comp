import { CheckCircle2, Clock, Code2, Keyboard, Eye } from "lucide-react";

function renderPlayerBadge(player, tone) {
  const getStatusIcon = () => {
    if (player.hasSubmitted && player.status === 'accepted') return <CheckCircle2 size={14} className="text-arena-400" />;
    if (player.hasSubmitted) return <Clock size={14} className="text-yellow-500 animate-pulse" />;
    if (player.isTyping) return <Keyboard size={14} className="text-paper-100 animate-bounce" />;
    return <Eye size={14} className="text-paper-200/50" />;
  };

  const getStatusBg = () => {
    if (player.hasSubmitted && player.status === 'accepted') return "bg-arena-500/20 border-arena-500/50";
    if (player.hasSubmitted) return "bg-yellow-500/20 border-yellow-500/50";
    return tone === "ally" ? "bg-arena-500/10 border-arena-500/20" : "bg-flame-500/10 border-flame-500/20";
  };

  const testsPassed = player.passedTests ?? 0;
  const testsTotal = player.totalTests ?? Math.max(1, testsPassed);
  const progressPercent = Math.round((testsPassed / testsTotal) * 100);

  return (
    <div key={player.id} className={`relative rounded-xl border p-3 flex flex-col gap-3 transition-colors ${getStatusBg()}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${tone === 'ally' ? 'bg-arena-500/20 text-arena-400' : 'bg-flame-500/20 text-flame-400'}`}>
            {player.username?.substring(0,2).toUpperCase() || '??'}
          </div>
          <div>
            <div className="font-bold text-sm text-white max-w-[100px] truncate">{player.username}</div>
            <div className="text-[10px] uppercase tracking-widest text-paper-200/50">{player.rating} ELO</div>
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-1.5 bg-black/40 rounded px-2 py-0.5 border border-white/5">
             {getStatusIcon()}
             <span className="text-[10px] font-bold uppercase tracking-widest text-paper-200/70">
               {player.hasSubmitted ? "Submitted" : player.isTyping ? "Typing..." : "Coding"}
             </span>
          </div>
          <div className="text-[9px] uppercase tracking-widest text-paper-200/40 font-mono bg-black/40 px-1.5 rounded flex items-center gap-1">
            <Code2 size={10} /> {player.latestLanguage || "WAIT"}
          </div>
        </div>
      </div>
      
    
      <div className="w-full bg-black/40 rounded-full h-1.5 border border-white/5 overflow-hidden">
        <div 
          className={`h-full transition-all duration-500 ${tone === 'ally' ? 'bg-arena-400' : 'bg-flame-400'}`} 
          style={{ width: `${progressPercent}%` }} 
        />
      </div>
      <div className="text-[10px] text-right font-mono text-paper-200/50 uppercase tracking-widest leading-none mt-[-4px]">
        {testsPassed}/{testsTotal} TESTS
      </div>
    </div>
  );
}

function OpponentPanel({ mode, teammates, opponents, currentPlayer, queueMessage }) {
  return (
    <div className="grid gap-4 xl:grid-cols-[1.1fr_1fr] h-full overflow-hidden">
      <div className="arena-panel p-5 flex flex-col h-full bg-gradient-to-b from-arena-500/5 to-transparent">
        <div className="flex items-center justify-between gap-3 mb-4 shrink-0">
          <div className="text-xs uppercase tracking-[0.25em] text-arena-400/80 font-bold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-arena-500" /> Your Team
          </div>
          <div className="rounded border border-arena-500/30 bg-arena-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-arena-400">
            {mode}
          </div>
        </div>
        <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar flex-1">
          {currentPlayer ? renderPlayerBadge(currentPlayer, "ally") : null}
          {teammates?.length ? teammates.map((player) => renderPlayerBadge(player, "ally")) : null}
          {!teammates?.length ? (
            <div className="rounded-xl border border-dashed border-white/10 bg-black/15 p-4 text-center text-[10px] uppercase tracking-widest text-paper-200/40">
              Solo lane active.
            </div>
          ) : null}
        </div>
      </div>

      <div className="arena-panel p-5 flex flex-col h-full bg-gradient-to-b from-flame-500/5 to-transparent">
        <div className="text-xs uppercase tracking-[0.25em] text-flame-400/80 font-bold flex items-center gap-2 mb-4 shrink-0">
          <span className="w-2 h-2 rounded-full bg-flame-500" /> Opposing Team
        </div>
        <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar flex-1">
          {opponents?.length ? (
            opponents.map((player) => renderPlayerBadge(player, "enemy"))
          ) : (
            <div className="rounded-xl border border-dashed border-white/10 bg-black/15 p-4 text-center text-[10px] uppercase tracking-widest text-paper-200/40">
              {queueMessage || "Waiting for opponents..."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default OpponentPanel;
