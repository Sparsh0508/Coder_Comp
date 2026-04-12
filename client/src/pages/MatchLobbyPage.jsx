import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import useCountdown from "../hooks/useCountdown";
import useMatchSocket from "../hooks/useMatchSocket";
import { getMatchById } from "../services/matchService";

function PlayerLobbyCard({ title, players, accentClass }) {
  return (
    <section className="arena-panel p-6">
      <div className={`text-xs uppercase tracking-[0.24em] ${accentClass}`}>{title}</div>
      <div className="mt-4 space-y-3">
        {players.map((player) => (
          <div key={player.id} className="rounded-2xl border border-white/10 bg-black/15 p-4 arena-coin-pop">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-lg font-semibold">{player.username}</div>
                <div className="text-sm text-paper-200/60">Rating {player.rating}</div>
              </div>
              <div className="text-right">
                <div className="text-xs uppercase tracking-[0.22em] text-paper-200/50">Entry</div>
                <div className="mt-1 text-xl font-bold">{player.coinContribution} coins</div>
              </div>
            </div>
            <div className="mt-3 text-sm text-paper-200/65">Balance after entry: {player.balanceAfterEntry ?? player.coinBalance ?? 0} coins</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function MatchLobbyPage() {
  const navigate = useNavigate();
  const { matchId } = useParams();
  const { refreshUser, updateUser, user } = useAuth();
  const [match, setMatch] = useState(null);
  const [message, setMessage] = useState("Preparing the arena...");
  const [cancelled, setCancelled] = useState(false);
  const loadedMatchIdRef = useRef(null);

  useMatchSocket({
    roomId: match?.roomId,
    onLobbyUpdated(payload) {
      setMatch((current) => ({ ...(current || {}), ...payload }));
      if (payload.currentPlayer?.coinBalance !== undefined) {
        updateUser({ coinBalance: payload.currentPlayer.coinBalance });
      }
    },
    onMatchStarted(payload) {
      navigate(`/match/${payload.matchId}`);
    },
    onMatchCancelled(payload) {
      setCancelled(true);
      setMessage(payload.reason || "Lobby cancelled.");
      refreshUser().catch(() => {});
    },
  });

  useEffect(() => {
    if (loadedMatchIdRef.current === matchId) {
      return;
    }

    loadedMatchIdRef.current = matchId;

    async function loadMatch() {
      const response = await getMatchById(matchId);

      if (response.match.status === "active") {
        navigate(`/match/${matchId}`, { replace: true });
        return;
      }

       if (response.match.status === "completed") {
        navigate(`/match/${matchId}/result`, { replace: true });
        return;
      }

      if (response.match.status === "cancelled") {
        navigate("/matchmaking", { replace: true });
        return;
      }

      setMatch(response.match);
      setMessage("Coins locked in. Chest is loading...");

      if (response.match.currentPlayer?.coinBalance !== undefined) {
        updateUser({ coinBalance: response.match.currentPlayer.coinBalance });
      }
    }

    loadMatch().catch((error) => setMessage(error.message));
  }, [matchId, navigate, updateUser]);

  const lobbyTimer = useCountdown(match?.lobbyEndsAt);
  const rewardPreview = useMemo(() => {
    if (!match?.prizePool || !match?.teamSize) {
      return 0;
    }

    return Math.floor(match.prizePool / match.teamSize);
  }, [match?.prizePool, match?.teamSize]);

  if (!match) {
    return <div className="flex h-full items-center justify-center">{message}</div>;
  }

  const yourTeam = [match.currentPlayer, ...(match.teammates || [])].filter(Boolean);
  const opposingTeam = match.opponents || [];

  return (
    <div className="mx-auto flex h-full max-w-7xl items-center justify-center">
      <div className="grid w-full gap-6 xl:grid-cols-[1fr_0.9fr_1fr]">
        <PlayerLobbyCard title="Your Side" players={yourTeam} accentClass="text-arena-400" />

        <section className="arena-chest arena-chest-glow flex flex-col items-center justify-center p-8 text-center">
          <div className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-xs uppercase tracking-[0.28em] text-paper-200/55">
            Match Lobby
          </div>
          <div className="mt-6 text-5xl font-black tracking-[0.3em]">VS</div>
          <div className="mt-6 rounded-[2rem] border border-arena-500/25 bg-gradient-to-br from-arena-500/15 to-flame-500/15 px-8 py-10">
            <div className="text-xs uppercase tracking-[0.28em] text-paper-200/55">VS Chest</div>
            <div className="mt-3 text-3xl font-bold">{match.prizePool} Coins</div>
            <div className="mt-2 text-sm text-paper-200/65">Entry {match.entryCoins} per player | Mode {match.mode}</div>
          </div>
          <div className="mt-6 rounded-2xl border border-white/10 bg-black/15 px-5 py-4">
            <div className="text-xs uppercase tracking-[0.22em] text-paper-200/50">Match starts in</div>
            <div className="mt-2 text-4xl font-bold">{cancelled ? "--:--" : lobbyTimer}</div>
          </div>
          <div className="mt-4 text-sm text-paper-200/65">
            Winner preview: each player on the winning team takes about {rewardPreview} coins.
          </div>
          <div className="mt-4 text-sm text-paper-200/60">{message}</div>
          <div className="mt-6 rounded-2xl border border-flame-400/20 bg-flame-500/10 px-4 py-3 text-sm text-flame-400">
            {user?.coinBalance ?? 0} coins remaining after entry deduction
          </div>
          {cancelled ? (
            <button className="arena-button-secondary mt-6" onClick={() => navigate("/matchmaking")}>
              Return to Queue
            </button>
          ) : null}
        </section>

        <PlayerLobbyCard title="Opposing Side" players={opposingTeam} accentClass="text-flame-400" />
      </div>
    </div>
  );
}

export default MatchLobbyPage;
