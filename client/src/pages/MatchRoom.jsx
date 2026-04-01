import { useEffect, useState, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { socket } from "../socket";
import PlayerCard from "../components/PlayerCard";

const MatchRoom = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [players, setPlayers] = useState(location.state?.players || []);

  // 🔥 keep latest players (important)
  const playersRef = useRef(players);

  useEffect(() => {
    playersRef.current = players;
  }, [players]);

  useEffect(() => {
    // fallback for refresh
    if (!players.length) {
      socket.on("match_found", (data) => {
        if (String(data.matchId) === String(id)) {
          setPlayers(data.players);
        }
      });
    }

    // 🚀 MATCH START
    socket.on("match_start", ({ matchId }) => {
      console.log("MATCH START RECEIVED:", matchId);

      if (String(matchId) === String(id)) {
        const currentPlayers = playersRef.current;

        // ✅ ensure players exist
        if (currentPlayers.length) {
          navigate(`/problem/${matchId}`, {
            state: { players: currentPlayers }
          });
        } else {
          console.log("⚠️ Players not ready, delaying...");

          // fallback delay
          setTimeout(() => {
            navigate(`/problem/${matchId}`, {
              state: { players: playersRef.current }
            });
          }, 500);
        }
      }
    });

    return () => {
      socket.off("match_found");
      socket.off("match_start");
    };
  }, [id]);

  const leftPlayer = players[0];
  const rightPlayer = players[1];

  return (
    <div className="h-screen bg-gray-900 text-white flex flex-col items-center justify-center">
      <h1 className="text-2xl mb-8">⚔️ Match Room #{id}</h1>

      <div className="flex gap-10 items-center">
        <PlayerCard title="YOU" playerId={leftPlayer} />
        <div className="text-3xl font-bold">VS</div>
        <PlayerCard title="OPPONENT" playerId={rightPlayer} />
      </div>

      <p className="mt-6 text-gray-400 animate-pulse">
        🚀 Starting match...
      </p>
    </div>
  );
};

export default MatchRoom;