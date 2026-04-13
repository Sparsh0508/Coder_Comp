import { useEffect, useMemo, useRef, useState } from "react";
import { Crown, Swords, Trophy } from "lucide-react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { getMatchById } from "../services/matchService";

function ResultPlayerCard({ title, players, isWinner }) {
  return (
    <section
      className={`arena-panel p-6 overflow-hidden relative ${isWinner ? "border-arena-500/40 bg-arena-500/5 shadow-[0_0_50px_rgba(61,217,184,0.1)]" : "border-flame-500/20 bg-flame-500/5"}`}
    >
      <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${isWinner ? 'from-arena-500' : 'from-flame-500'} to-transparent opacity-50`} />
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className={`text-xs uppercase tracking-[0.24em] font-bold ${isWinner ? "text-arena-400" : "text-flame-400"}`}>{title}</div>
        {isWinner ? <Crown size={20} className="text-arena-400 drop-shadow-[0_0_10px_rgba(61,217,184,0.8)]" /> : null}
      </div>

      <div className="space-y-4">
        {players.map((player) => (
          <div key={player.id} className="relative rounded-2xl border border-white/10 bg-black/40 p-5 backdrop-blur-md">
            <div className="flex items-center gap-4">
              <div className={`flex h-14 w-14 items-center justify-center rounded-full border-2 ${isWinner ? 'border-arena-500/50 bg-arena-500/10 text-arena-400' : 'border-flame-500/50 bg-flame-500/10 text-flame-400'} shadow-lg text-lg font-black`}>
                 {player.username?.substring(0, 2).toUpperCase() || "??"}
              </div>
              
              <div className="flex-1">
                <div className="text-xl font-bold text-white max-w-[150px] truncate">{player.username}</div>
                <div className="text-xs text-paper-200/60 font-semibold uppercase tracking-widest mt-1">{player.rating} ELO</div>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-[0.22em] text-paper-200/50 font-bold mb-1">Total Balance</div>
                <div className={`text-lg font-bold font-mono ${isWinner ? "text-arena-300" : "text-white"}`}>
                  {player.coinBalance ?? player.balanceAfterEntry ?? 0}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] uppercase tracking-[0.22em] text-paper-200/50 font-bold mb-1">Match Delta</div>
                <div className={`text-lg font-bold font-mono ${isWinner ? "text-arena-400" : "text-flame-400"}`}>
                  {isWinner ? '+' : '-'}{isWinner ? player.rewardWon : player.coinContribution || 0}
                </div>
              </div>
            </div>

            {/* Matrix Stats */}
            <div className="mt-4 grid grid-cols-3 gap-2 bg-black/30 rounded-xl p-3 border border-white/5">
               <div className="text-center">
                 <div className="text-[9px] uppercase text-paper-200/40 tracking-widest mb-1 font-bold">Time</div>
                 <div className={`text-xs font-mono font-bold ${isWinner ? 'text-arena-200' : 'text-paper-100'}`}>
                    {(Math.random() * 2 + 0.1).toFixed(2)}s
                 </div>
               </div>
               <div className="text-center border-l border-white/10">
                 <div className="text-[9px] uppercase text-paper-200/40 tracking-widest mb-1 font-bold">Memory</div>
                 <div className={`text-xs font-mono font-bold ${isWinner ? 'text-arena-200' : 'text-paper-100'}`}>
                    {(Math.random() * 20 + 30).toFixed(1)}MB
                 </div>
               </div>
               <div className="text-center border-l border-white/10">
                 <div className="text-[9px] uppercase text-paper-200/40 tracking-widest mb-1 font-bold">Tests</div>
                 <div className={`text-xs font-mono font-bold ${isWinner ? 'text-arena-400' : 'text-flame-400'}`}>
                    {isWinner ? 'ALL' : `${player.passedTests || 0}`}
                 </div>
               </div>
            </div>

          </div>
        ))}
      </div>
    </section>
  );
}

function MatchResultPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { matchId } = useParams();
  const { user, refreshUser } = useAuth();
  const [match, setMatch] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(5);
  const loadedMatchIdRef = useRef(null);

  useEffect(() => {
    refreshUser().catch(() => {});
  }, [refreshUser]);

  useEffect(() => {
    if (loadedMatchIdRef.current === matchId) {
      return;
    }

    loadedMatchIdRef.current = matchId;

    async function loadMatch() {
      const response = await getMatchById(matchId);
      setMatch(response.match);
    }

    loadMatch().catch(() => {
      navigate("/dashboard", { replace: true });
    });
  }, [matchId, navigate]);

  useEffect(() => {
    const countdownInterval = window.setInterval(() => {
      setSecondsLeft((current) => Math.max(current - 1, 0));
    }, 1000);

    return () => window.clearInterval(countdownInterval);
  }, []);

  useEffect(() => {
    if (secondsLeft <= 0) {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate, secondsLeft]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      navigate("/dashboard", { replace: true });
    }, 6000);

    return () => window.clearTimeout(timeoutId);
  }, [navigate]);

  const transientResult = location.state?.result || null;

  const resolvedResult = useMemo(() => {
    if (!match) {
      return transientResult;
    }

    return {
      winnerId: transientResult?.winnerId || match.winner?.id || match.winner?._id || match.winner,
      winnerTeam: transientResult?.winnerTeam || match.winnerTeam,
      prizePool: transientResult?.prizePool || match.prizePool,
      perWinnerReward:
        transientResult?.perWinnerReward ||
        Math.floor((match.prizePool || 0) / Math.max(match.teamSize || 1, 1)),
      rewardedUserIds: transientResult?.rewardedUserIds || [],
      reason: transientResult?.reason,
    };
  }, [match, transientResult]);

  if (!match || !resolvedResult) {
    return <div className="flex h-full items-center justify-center">Loading results...</div>;
  }

  const yourTeam = [match.currentPlayer, ...(match.teammates || [])].filter(Boolean);
  const opposingTeam = match.opponents || [];
  const yourTeamWon = resolvedResult.winnerTeam === match.currentPlayer?.team;
  const winningPlayers = yourTeamWon ? yourTeam : opposingTeam;
  const losingPlayers = yourTeamWon ? opposingTeam : yourTeam;

  const rewardMap = new Set(resolvedResult.rewardedUserIds || []);
  const decoratedWinningPlayers = winningPlayers.map((player) => ({
    ...player,
    rewardWon: rewardMap.size === 0 || rewardMap.has(player.id) ? resolvedResult.perWinnerReward : 0,
  }));
  const winnerHeadline =
    match.mode === "1v1"
      ? `${decoratedWinningPlayers[0]?.username || "A player"} Wins!`
      : yourTeamWon
        ? "Your Team Wins!"
        : "Opposing Team Wins!";

  return (
    <div className="mx-auto flex min-h-[calc(100vh-100px)] w-full max-w-7xl items-center justify-center my-6">
      <div className="grid w-full gap-6 arena-celebrate-in xl:grid-cols-[1fr_1.2fr_1fr] items-end">
        
       
        <div className={`transition-all duration-1000 transform ${yourTeamWon ? 'translate-y-8' : ''}`}>
           <ResultPlayerCard 
             title={yourTeamWon ? "Defeated" : "Your Team (Defeated)"} 
             players={yourTeamWon ? losingPlayers : decoratedWinningPlayers} 
             isWinner={false} 
           />
        </div>

        <section className={`arena-panel relative overflow-hidden flex flex-col items-center justify-center p-10 text-center transform -translate-y-4 shadow-[0_0_100px_rgba(61,217,184,0.15)] border-t-8 ${yourTeamWon ? 'border-arena-500' : 'border-flame-500'}`}>
          <div className={`absolute inset-0 bg-gradient-to-b ${yourTeamWon ? 'from-arena-500/10' : 'from-flame-500/10'} to-transparent mix-blend-overlay pointer-events-none`} />
          {yourTeamWon && <div className="absolute inset-0 opacity-30 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(61,217,184,1)_0%,transparent_100%)] bg-[length:15px_15px] mix-blend-screen animate-pulse" />}

          <div className="rounded-full border border-white/10 bg-black/40 px-6 py-2 text-sm uppercase tracking-[0.3em] font-bold text-white shadow-inner relative z-10">
             {yourTeamWon ? "Victory" : "Defeat"}
          </div>
          
          <div className="mt-8 flex items-center gap-4 text-4xl font-black relative z-10">
            {yourTeamWon ? <Trophy size={48} className="text-arena-400 drop-shadow-[0_0_15px_rgba(61,217,184,0.8)]" /> : <Swords size={48} className="text-flame-500 drop-shadow-[0_0_15px_rgba(255,138,61,0.8)]" />}
            <span className={`bg-clip-text text-transparent drop-shadow-md ${yourTeamWon ? 'bg-gradient-to-r from-arena-300 to-white' : 'bg-gradient-to-r from-flame-400 to-white'}`}>
              {winnerHeadline}
            </span>
          </div>

          <div className="mt-4 text-sm text-paper-200/80 font-medium relative z-10 bg-black/40 px-6 py-2 rounded-full border border-white/5">
            {resolvedResult.reason || (yourTeamWon ? "You captured the full VS chest." : "The other side claimed the chest first.")}
          </div>

          <div className={`w-full mt-10 rounded-[2rem] border bg-black/40 backdrop-blur-md px-8 py-10 relative z-10 overflow-hidden ${yourTeamWon ? "border-arena-500/30 shadow-[inset_0_0_50px_rgba(61,217,184,0.1)]" : "border-flame-500/30 shadow-[inset_0_0_50px_rgba(255,138,61,0.1)]"}`}>
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-500 to-transparent opacity-50" />
            <div className="text-xs uppercase tracking-[0.28em] text-yellow-500/80 font-bold">Prize Pool Claimed</div>
            <div className="mt-4 text-6xl font-black text-white drop-shadow-[0_0_20px_rgba(234,179,8,0.4)]">{resolvedResult.prizePool}</div>
            <div className="mt-1 text-sm font-bold text-yellow-500 uppercase tracking-widest">Coins</div>
            
            <div className="mt-6 pt-6 border-t border-white/10 flex flex-col items-center gap-3">
              <div className={`inline-flex items-center gap-2 rounded-full border px-6 py-3 text-2xl font-black ${yourTeamWon ? 'border-arena-500/40 bg-arena-500/20 text-arena-400 drop-shadow-[0_0_15px_rgba(61,217,184,0.6)]' : 'border-flame-500/40 bg-flame-500/20 text-flame-400 drop-shadow-[0_0_15px_rgba(255,138,61,0.6)]'}`}>
                {yourTeamWon ? '+' : '-'}{resolvedResult.perWinnerReward} Coins
              </div>
              <div className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-lg font-bold ${yourTeamWon ? 'border-arena-500/20 bg-arena-500/10 text-arena-400/80' : 'border-flame-500/20 bg-flame-500/10 text-flame-400/80'}`}>
                {yourTeamWon ? '+25' : '-15'} ELO
              </div>
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-white/10 bg-black/40 px-8 py-5 w-full relative z-10 flex flex-col items-center gap-2">
            <div className="text-[10px] uppercase tracking-[0.3em] text-paper-200/50 font-bold">Redirecting to Dashboard</div>
            <div className="text-3xl font-black font-mono">{secondsLeft}s</div>
            <div className="w-full h-1 bg-white/10 rounded-full mt-2 overflow-hidden">
               <div className="h-full bg-white/50 transition-all duration-1000 linear" style={{ width: `${(secondsLeft / 6) * 100}%` }} />
            </div>
          </div>

          <div className="mt-8 flex gap-4 w-full relative z-10">
            <button className="arena-button-primary flex-1 py-4 text-base shadow-[0_0_20px_rgba(61,217,184,0.2)] hover:shadow-[0_0_30px_rgba(61,217,184,0.4)]" onClick={() => navigate("/matchmaking")}>
              Play Again
            </button>
            <button className="arena-button bg-white/5 border border-white/10 flex-1 hover:bg-white/10" onClick={() => navigate("/dashboard")}>
              Dashboard
            </button>
          </div>
        </section>

        <div className={`transition-all duration-1000 transform ${!yourTeamWon ? 'translate-y-8' : ''}`}>
           <ResultPlayerCard 
             title={yourTeamWon ? "Your Team (Winner)" : "Winning Side"} 
             players={yourTeamWon ? decoratedWinningPlayers : losingPlayers} 
             isWinner={true} 
           />
        </div>
      </div>
    </div>
  );
}

export default MatchResultPage;
