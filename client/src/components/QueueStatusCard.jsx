import { motion } from "framer-motion";
import { Loader2, Users, Shield, Zap } from "lucide-react";

const matchModes = [
  { value: "1v1", label: "1v1", description: "Classic duel", icon: Shield },
  { value: "2v2", label: "2v2", description: "Small team battle", icon: Users },
  { value: "4v4", label: "4v4", description: "Full squad clash", icon: Users },
];

function QueueStatusCard({ queueState, selectedMode, entryCoins, onModeChange, onFindMatch, onCancel, activeMatch, user }) {
  const hasActiveMatch = Boolean(activeMatch?.matchId);

  if (queueState.searching) {
    return (
      <div className="arena-panel relative overflow-hidden flex min-h-[500px] flex-col items-center justify-center p-8">
       
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:30px_30px] opacity-20 [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_70%)] animate-[pulse_4s_ease-in-out_infinite]" />
        
        <div className="relative z-10 flex w-full max-w-2xl flex-col items-center justify-center">
       
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12 text-center"
          >
            <h2 className="text-2xl font-black text-white">{queueState.message}</h2>
            <p className="mt-2 text-paper-200/60 uppercase tracking-widest text-sm">
              Estimated wait: &lt; 1 min • Queue Size: {queueState.queueSize}
            </p>
          </motion.div>

       
          <div className="flex w-full items-center justify-between gap-4 px-4">
       
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col items-center gap-3"
            >
              <div className="flex h-28 w-28 items-center justify-center rounded-full border-2 border-arena-500 bg-arena-950 shadow-[0_0_30px_rgba(61,217,184,0.4)]">
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-arena-500/20 text-3xl font-black text-arena-400">
                  {user?.username?.substring(0, 2).toUpperCase() || "ME"}
                </div>
              </div>
              <div className="text-center">
                <div className="font-bold text-white text-lg">{user?.username}</div>
                <div className="text-arena-400 text-sm font-semibold flex items-center justify-center gap-1">
                  {user?.rating ?? 1200} <Zap size={14} fill="currentColor" />
                </div>
              </div>
            </motion.div>

       
            <div className="relative flex items-center justify-center">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="absolute flex h-24 w-24 items-center justify-center rounded-full border border-dashed border-arena-400/50"
              />
              <motion.div 
                animate={{ rotate: -360 }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="absolute flex h-32 w-32 items-center justify-center rounded-full border-[1px] border-flame-400/30"
              />
              <div className="z-10 text-3xl font-black italic bg-gradient-to-br from-white to-paper-200/50 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">
                VS
              </div>
            </div>

       
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col items-center gap-3"
            >
              <div className="relative flex h-28 w-28 items-center justify-center rounded-full border-2 border-flame-500/50 bg-arena-950 shadow-[0_0_30px_rgba(255,138,61,0.2)] overflow-hidden">
                <div className="absolute inset-0 bg-flame-500/10 backdrop-blur-md" />
                <div className="relative z-10 text-3xl font-black text-flame-400/50 mix-blend-screen animate-pulse">
                  ???
                </div>
              </div>
              <div className="text-center">
                <div className="font-bold text-paper-200/40 text-lg">Searching...</div>
                <div className="text-flame-400/40 text-sm font-semibold flex items-center justify-center gap-1">
                  --- <Zap size={14} />
                </div>
              </div>
            </motion.div>
          </div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-16"
          >
            <button 
              className="arena-button bg-transparent border border-flame-500 text-flame-400 hover:bg-flame-500/10 hover:shadow-[0_0_20px_rgba(255,138,61,0.2)] rounded-full px-8 uppercase tracking-widest text-sm" 
              onClick={onCancel}
            >
              Cancel Matchmaking
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="arena-panel p-8">
      <div className="mb-4 inline-flex rounded-full border border-flame-400/25 bg-flame-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-flame-400">
        Matchmaking
      </div>
      <h2 className="text-3xl font-bold">Ready for your next duel?</h2>
      <p className="mt-3 max-w-2xl text-paper-200/65 border-b border-white/10 pb-6">
        Select a mode, join the live queue, get paired instantly, and race to clear the same hidden test suite first.
      </p>

      <div className="mt-6 grid gap-4">
        {matchModes.map((mode) => {
          const isActive = selectedMode === mode.value;
          const Icon = mode.icon;

          return (
            <button
              key={mode.value}
              type="button"
              onClick={() => onModeChange(mode.value)}
              disabled={hasActiveMatch}
              className={`rounded-2xl border p-5 text-left transition-all duration-300 flex items-center justify-between group ${
                isActive
                  ? "border-arena-500/60 bg-gradient-to-r from-arena-500/10 to-transparent shadow-[inset_4px_0_0_rgba(61,217,184,1)]"
                  : "border-white/5 bg-white/5 mx-1 hover:bg-white/10 hover:border-white/20"
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${isActive ? 'bg-arena-500/20 text-arena-400' : 'bg-black/20 text-paper-200/60'}`}>
                  <Icon size={24} />
                </div>
                <div>
                  <div className={`text-xl font-bold ${isActive ? 'text-white' : 'text-paper-200/80'}`}>{mode.label}</div>
                  <div className="mt-1 text-sm text-paper-200/50">{mode.description}</div>
                </div>
              </div>
              <div className="text-right hidden sm:block">
                <div className="text-xs uppercase tracking-widest text-paper-200/40">Entry Fee</div>
                <div className="flex items-center gap-1 font-mono font-bold text-yellow-400 mt-1">
                  {entryCoins} Coins
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-8">
        <button 
          className="arena-button-primary w-full shadow-[0_0_20px_rgba(61,217,184,0.2)] hover:shadow-[0_0_40px_rgba(61,217,184,0.4)] text-lg h-14" 
          onClick={onFindMatch} 
          disabled={queueState.searching}
        >
          {hasActiveMatch
            ? "Resume Active Match"
            : `Enter ${selectedMode} Queue`}
        </button>
      </div>
    </div>
  );
}

export default QueueStatusCard;
