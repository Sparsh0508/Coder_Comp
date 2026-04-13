import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { fetchLeaderboard } from "../services/leaderboardService";
import { Trophy, Medal, Star } from "lucide-react";

const podiumVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.2, type: "spring", stiffness: 100 }
  })
};

const rowVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i) => ({
    opacity: 1,
    x: 0,
    transition: { delay: 0.6 + i * 0.1 }
  })
};

function PodiumCard({ player, rank }) {
  if (!player) return null;

  const isFirst = rank === 1;
  const isSecond = rank === 2;
  const isThird = rank === 3;

  const heightClass = isFirst ? "h-64" : isSecond ? "h-56" : "h-48";
  const borderClass = isFirst ? "border-yellow-400 bg-yellow-500/10 shadow-[0_0_30px_rgba(250,204,21,0.3)] z-20" : 
                      isSecond ? "border-slate-300 bg-slate-400/10 shadow-[0_0_20px_rgba(203,213,225,0.2)] z-10" : 
                      "border-amber-600 bg-amber-700/10 shadow-[0_0_20px_rgba(217,119,6,0.1)] z-0";
  const iconColor = isFirst ? "text-yellow-400" : isSecond ? "text-slate-300" : "text-amber-600";
  const orderClass = isFirst ? "order-2" : isSecond ? "order-1 translate-y-8" : "order-3 translate-y-16";

  return (
    <motion.div 
       custom={rank}
       initial="hidden"
       animate="visible"
       variants={podiumVariants}
       className={`flex flex-col items-center justify-end ${orderClass}`}
    >
      <div className="flex flex-col items-center mb-4">
        <div className={`w-16 h-16 rounded-full border-2 ${borderClass} flex items-center justify-center font-black text-xl mb-3 shrink-0`}>
          {player.username?.substring(0, 2).toUpperCase()}
        </div>
        <div className="font-bold text-white max-w-[120px] truncate text-center">{player.username}</div>
        <div className={`text-sm font-black mt-1 ${iconColor}`}>{player.rating} ELO</div>
      </div>
      <div className={`w-32 ${heightClass} rounded-t-2xl border-t-2 border-x-2 ${borderClass} flex flex-col items-center pt-6`}>
         {isFirst ? <Trophy size={40} className={iconColor} /> : <Medal size={40} className={iconColor} />}
         <div className={`text-5xl font-black mt-2 opacity-50 ${iconColor}`}>#{rank}</div>
      </div>
    </motion.div>
  );
}

function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchLeaderboard()
      .then((response) => setLeaderboard(response.leaderboard))
      .catch((requestError) => setError(requestError.message));
  }, []);

  const topThree = leaderboard.slice(0, 3);
  const remaining = leaderboard.slice(3);

  return (
    <div className="max-w-6xl mx-auto py-8">
      <div className="text-center mb-16">
        <div className="text-xs uppercase tracking-[0.4em] text-arena-400 font-bold mb-3 flex items-center justify-center gap-2">
          <Star size={12} /> Global Ranking <Star size={12} />
        </div>
        <h1 className="text-5xl font-black text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.2)] bg-clip-text text-transparent bg-gradient-to-b from-white to-paper-200/50">Leaderboard</h1>
      </div>

      {error ? <div className="p-6 text-center text-flame-400 font-bold">{error}</div> : null}

      {!error && leaderboard.length > 0 && (
        <>
         
          <div className="flex justify-center items-end gap-2 sm:gap-6 mb-16 px-4">
             {topThree[1] && <PodiumCard player={topThree[1]} rank={2} />}
             {topThree[0] && <PodiumCard player={topThree[0]} rank={1} />}
             {topThree[2] && <PodiumCard player={topThree[2]} rank={3} />}
          </div>

          
          {remaining.length > 0 && (
            <div className="arena-panel overflow-hidden mx-4">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left">
                  <thead className="bg-black/40 text-xs uppercase tracking-[0.2em] text-paper-200/50 border-b border-white/10">
                    <tr>
                      <th className="px-8 py-5">Rank</th>
                      <th className="px-8 py-5">Player</th>
                      <th className="px-8 py-5">Rating</th>
                      <th className="px-8 py-5">Wins</th>
                      <th className="px-8 py-5">Losses</th>
                      <th className="px-8 py-5">Win Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {remaining.map((player, index) => {
                      const winRate = player.totalMatches > 0 ? Math.round((player.wins / player.totalMatches) * 100) : 0;
                      return (
                        <motion.tr 
                          key={player.id} 
                          custom={index}
                          initial="hidden"
                          animate="visible"
                          variants={rowVariants}
                          className="border-t border-white/5 hover:bg-white/5 transition-colors group"
                        >
                          <td className="px-8 py-5 font-black text-paper-200/40 group-hover:text-arena-400 transition-colors">#{player.rank}</td>
                          <td className="px-8 py-5 font-bold text-white flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-arena-950 border border-white/10 flex items-center justify-center text-xs text-arena-400 uppercase">
                              {player.username?.substring(0,2)}
                            </div>
                            {player.username}
                          </td>
                          <td className="px-8 py-5 font-bold text-arena-200">{player.rating}</td>
                          <td className="px-8 py-5 text-paper-200/80">{player.wins}</td>
                          <td className="px-8 py-5 text-paper-200/80">{player.losses}</td>
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-2">
                              <span className="text-paper-100 font-mono text-sm">{winRate}%</span>
                              <div className="w-16 h-1.5 bg-black/50 rounded-full overflow-hidden">
                                <div className="h-full bg-arena-500" style={{ width: `${winRate}%` }} />
                              </div>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default LeaderboardPage;
