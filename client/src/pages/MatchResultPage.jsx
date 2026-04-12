import { useEffect, useMemo, useRef, useState } from "react";
import { Crown, Swords, Trophy } from "lucide-react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { getMatchById } from "../services/matchService";

function ResultPlayerCard({ title, players, isWinner }) {
  return (
    <section
      className={`arena-panel p-6 ${isWinner ? "ring-1 ring-arena-500/50 shadow-[0_0_70px_rgba(61,217,184,0.16)]" : ""}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className={`text-xs uppercase tracking-[0.24em] ${isWinner ? "text-arena-400" : "text-flame-400"}`}>{title}</div>
        {isWinner ? <Crown size={18} className="text-arena-400" /> : null}
      </div>

      <div className="mt-4 space-y-3">
        {players.map((player) => (
          <div key={player.id} className="rounded-2xl border border-white/10 bg-black/15 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-lg font-semibold">{player.username}</div>
                <div className="text-sm text-paper-200/60">Rating {player.rating}</div>
              </div>
              <div className="text-right">
                <div className="text-xs uppercase tracking-[0.22em] text-paper-200/50">Wallet</div>
                <div className={`mt-1 text-xl font-bold ${isWinner ? "text-arena-400" : "text-paper-100"}`}>
                  {player.coinBalance ?? player.balanceAfterEntry ?? 0}
                </div>
              </div>
            </div>
            <div className="mt-3 text-sm text-paper-200/65">
              {isWinner ? `Rewarded ${player.rewardWon ?? 0} coins` : `Contributed ${player.coinContribution ?? 0} coins`}
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
      setSecondsLeft((current) => {
        if (current <= 1) {
          window.clearInterval(countdownInterval);
          navigate("/dashboard", { replace: true });
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(countdownInterval);
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
    <div className="mx-auto flex h-full max-w-7xl items-center justify-center">
      <div className="grid w-full gap-6 arena-celebrate-in xl:grid-cols-[1fr_0.9fr_1fr]">
        <ResultPlayerCard title={yourTeamWon ? "Winner" : "Your Side"} players={yourTeamWon ? decoratedWinningPlayers : losingPlayers} isWinner={yourTeamWon} />

        <section className="arena-chest arena-chest-glow flex flex-col items-center justify-center p-8 text-center">
          <div className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-xs uppercase tracking-[0.28em] text-paper-200/55">
            Match Complete
          </div>
          <div className="mt-5 flex items-center gap-3 text-3xl font-black">
            <Trophy className="text-arena-400" />
            {winnerHeadline}
          </div>
          <div className="mt-3 text-sm text-paper-200/65">
            {resolvedResult.reason || (yourTeamWon ? "You captured the full VS chest." : "The other side claimed the chest first.")}
          </div>

          <div className={`arena-payout-stream mt-8 rounded-[2rem] border border-arena-500/25 bg-gradient-to-br from-arena-500/15 to-flame-500/15 px-8 py-10 ${yourTeamWon ? "arena-payout-left" : "arena-payout-right"}`}>
            <div className="text-xs uppercase tracking-[0.28em] text-paper-200/55">VS Chest</div>
            <div className="mt-3 text-4xl font-bold">{resolvedResult.prizePool} Coins</div>
            <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-arena-500/25 bg-arena-500/10 px-4 py-2 text-lg font-bold text-arena-400">
              <Swords size={18} />
              +{resolvedResult.perWinnerReward} Coins
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-black/15 px-5 py-4">
            <div className="text-xs uppercase tracking-[0.22em] text-paper-200/50">Redirecting in</div>
            <div className="mt-2 text-4xl font-bold">{secondsLeft}s</div>
          </div>

          <div className="mt-5 flex gap-3">
            <button className="arena-button-primary" onClick={() => navigate("/matchmaking")}>
              Play Again
            </button>
            <button className="arena-button-secondary" onClick={() => navigate("/dashboard")}>
              Go To Dashboard
            </button>
          </div>
        </section>

        <ResultPlayerCard title={yourTeamWon ? "Loser" : "Winning Side"} players={yourTeamWon ? losingPlayers : decoratedWinningPlayers} isWinner={!yourTeamWon} />
      </div>
    </div>
  );
}

export default MatchResultPage;
