import { motion } from "framer-motion";
import { Trophy, AlertOctagon } from "lucide-react";

function ResultBanner({ result, userId, userTeam }) {
  if (!result) {
    return null;
  }

  const hasWon = result.winnerTeam ? result.winnerTeam === userTeam : result.winnerId === userId;

  return (
    <motion.div
      initial={{ y: -100, opacity: 0, scale: 0.9 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={`fixed inset-x-4 top-8 z-50 mx-auto max-w-2xl rounded-3xl border-2 px-8 py-6 shadow-[0_30px_100px_rgba(0,0,0,0.8)] backdrop-blur-xl overflow-hidden ${
        hasWon
          ? "border-arena-400 bg-arena-950/90 text-white"
          : "border-flame-500 bg-black/90 text-white"
      }`}
    >
      {hasWon && (
        <>
          <div className="absolute inset-0 bg-gradient-to-br from-arena-500/20 to-transparent pointer-events-none" />
          {/* Confetti effect background */}
          <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(61,217,184,1)_0%,transparent_100%)] bg-[length:10px_10px] mix-blend-screen" />
        </>
      )}
      {!hasWon && (
        <div className="absolute inset-0 bg-gradient-to-br from-flame-500/20 to-transparent pointer-events-none" />
      )}
      
      <div className="relative z-10 flex items-center gap-6">
        <div className={`p-4 rounded-full ${hasWon ? 'bg-arena-500/20 text-arena-400' : 'bg-flame-500/20 text-flame-500'}`}>
           {hasWon ? <Trophy size={40} /> : <AlertOctagon size={40} />}
        </div>
        <div>
          <div className={`text-[10px] font-bold uppercase tracking-[0.4em] ${hasWon ? 'text-arena-400' : 'text-flame-500'}`}>
            Match Complete
          </div>
          <h2 className={`mt-1 text-3xl font-black uppercase tracking-wider drop-shadow-lg ${hasWon ? 'text-transparent bg-clip-text bg-gradient-to-r from-arena-300 to-white' : 'text-white'}`}>
            {hasWon ? "Victory Secured" : "Defeat"}
          </h2>
          <p className="mt-2 text-sm text-paper-200/80 font-medium">
            {result.reason || (hasWon ? "You cleared the full test suite first." : "Your opponent finished first.")}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export default ResultBanner;
