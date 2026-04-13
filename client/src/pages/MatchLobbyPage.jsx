import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import useCountdown from "../hooks/useCountdown";
import useMatchSocket from "../hooks/useMatchSocket";
import { getMatchById } from "../services/matchService";

function PlayerLobbyCard({ title, players, accentClass, bgAccent }) {
  return (
    <section className="arena-panel p-6 relative overflow-hidden">
      <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${bgAccent} to-transparent opacity-50`} />
      <div className={`text-xs uppercase tracking-[0.24em] ${accentClass}`}>{title}</div>
      <div className="mt-4 space-y-4">
        {players.map((player) => (
          <div key={player.id} className="relative rounded-2xl border border-white/10 bg-black/30 p-5 backdrop-blur-md overflow-hidden group transition-all hover:bg-black/40 hover:border-white/20">
           
            <div className="absolute top-4 right-4 flex flex-col items-end">
              <div className="inline-flex items-center gap-1 rounded-full border border-yellow-500/40 bg-yellow-500/10 px-3 py-1 text-xs font-bold text-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.2)]">
                {player.coinContribution || "-"} COINS
              </div>
              <div className="mt-2 text-[10px] uppercase tracking-widest text-paper-200/40">Entry locked</div>
            </div>

            <div className="flex items-center gap-4">
              
              <div className={`flex h-16 w-16 items-center flex-shrink-0 justify-center rounded-full border-2 border-white/10 ${bgAccent.replace('from-', 'bg-').replace('/20', '/10')} shadow-lg`}>
                 <div className={`text-xl font-black ${accentClass}`}>
                    {player.username?.substring(0, 2).toUpperCase() || "??"}
                 </div>
              </div>
              
              <div>
                <div className="text-xl font-bold text-white truncate max-w-[150px]">{player.username}</div>
                <div className="flex items-center gap-2 mt-1">
                  <div className={`text-sm font-semibold ${accentClass}`}>{player.rating} ELO</div>
                  <div className="h-1 w-1 rounded-full bg-white/20" />
                  <div className="flex items-center gap-1.5 text-[10px] text-paper-200/60 uppercase tracking-widest">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-arena-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-arena-500"></span>
                    </span>
                    Ready
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
              <div className="text-sm text-paper-200/65">Bal: {player.balanceAfterEntry ?? player.coinBalance ?? 0}</div>
              <div className="font-mono text-xs text-paper-200/40 uppercase tracking-widest bg-white/5 px-2 py-1 rounded">{player.latestLanguage || "WAITING"}</div>
            </div>
          </div>
        ))}
        {players.length === 0 && (
          <div className="animate-pulse rounded-2xl border border-dashed border-white/10 bg-white/5 p-8 text-center text-sm text-paper-200/50 uppercase tracking-widest">
            Waiting for player...
          </div>
        )}
      </div>
    </section>
  );
}

function MatchLobbyPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { matchId } = useParams();
  const { refreshUser, updateUser, user } = useAuth();
  const [match, setMatch] = useState(null);
  const [message, setMessage] = useState("Preparing the arena...");
  const [cancelled, setCancelled] = useState(false);
  const [notice, setNotice] = useState(location.state?.notice || "");
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
    const storedNotice = window.sessionStorage.getItem("match_notice");
    if (storedNotice) {
      setNotice(storedNotice);
      window.sessionStorage.removeItem("match_notice");
    }
  }, []);

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

  // Determine timer urgency
  let isUrgent = false;
  if (lobbyTimer && lobbyTimer !== "--:--") {
    const parts = lobbyTimer.split(":");
    if (parts.length === 2 && parseInt(parts[0]) === 0 && parseInt(parts[1]) <= 5) {
      isUrgent = true;
    }
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-100px)] w-full max-w-7xl items-center justify-center my-6">
      <div className="grid w-full gap-6">
        {notice ? (
          <div className="rounded-2xl border border-arena-500/30 bg-arena-500/10 px-4 py-3 text-sm text-arena-200">
            {notice}
          </div>
        ) : null}
        <div className="grid w-full gap-6 xl:grid-cols-[1fr_0.9fr_1fr] items-stretch">
          <PlayerLobbyCard title="Your Side" players={yourTeam} accentClass="text-arena-400" bgAccent="from-arena-500/80" />

          <section className="arena-panel relative overflow-hidden flex flex-col items-center justify-center p-8 text-center border-t-4 border-t-arena-500/50 shadow-[0_30px_100px_rgba(0,0,0,0.5)]">
            <div className="absolute inset-0 bg-gradient-to-b from-arena-500/5 to-flame-500/5 mix-blend-overlay pointer-events-none" />
            
            <div className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-xs uppercase tracking-[0.28em] text-paper-200/55 relative z-10 box-shadow-[0_0_20px_rgba(255,255,255,0.05)]">
              Match Lobby
            </div>
            
            <div className="mt-8 relative z-10 flex flex-col items-center">
              <div className="text-sm font-bold uppercase tracking-widest text-paper-200/50 mb-2">Countdown</div>
              <div className={`text-6xl font-black bg-clip-text text-transparent transform transition-all duration-500 ${isUrgent ? 'animate-pulse scale-110 drop-shadow-[0_0_30px_rgba(255,50,50,0.8)] bg-gradient-to-b from-red-400 to-red-600' : 'bg-gradient-to-b from-white to-paper-200/50 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]'}`}>
                {cancelled ? "--:--" : lobbyTimer}
              </div>
            </div>

            <div className="mt-10 w-full rounded-[2rem] border border-yellow-500/20 bg-gradient-to-br from-yellow-500/10 to-flame-500/5 px-8 py-8 relative z-10 shadow-[inset_0_0_30px_rgba(234,179,8,0.05)]">
              <div className="text-xs uppercase tracking-[0.28em] text-yellow-500/80 font-bold mb-2 flex items-center justify-center gap-2">
                <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" /> 
                Prize Chest
                <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
              </div>
              <div className="text-4xl font-black text-white drop-shadow-[0_0_20px_rgba(234,179,8,0.5)]">{match.prizePool}</div>
              <div className="text-sm font-bold text-yellow-500 mt-1 uppercase tracking-widest">Coins</div>
            </div>

            <div className="mt-8 text-sm text-paper-200/50 uppercase tracking-widest font-semibold flex items-center gap-2">
              <span className="w-10 h-px bg-white/10" />
              Mode {match.mode}
              <span className="w-10 h-px bg-white/10" />
            </div>

            {cancelled ? (
              <button className="arena-button bg-flame-500 hover:bg-flame-400 text-arena-950 font-bold mt-8 w-full transition-all hover:shadow-[0_0_20px_rgba(255,138,61,0.5)]" onClick={() => navigate("/matchmaking")}>
                Return to Queue
              </button>
            ) : null}
          </section>

          <PlayerLobbyCard title="Opposing Side" players={opposingTeam} accentClass="text-flame-400" bgAccent="from-flame-500/80" />
        </div>
      </div>
    </div>
  );
}

export default MatchLobbyPage;
