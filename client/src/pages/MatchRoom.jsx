import { useEffect, useState, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { socket } from "../socket";
import PlayerCard from "../components/PlayerCard";

const MatchRoom = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [players, setPlayers] = useState(location.state?.players || []);
  const [playersNames, setPlayersNames] = useState(location.state?.playersNames || []);
  const playersRef = useRef(players);
  const playersNamesRef = useRef(playersNames);

  useEffect(() => {
    playersRef.current = players;
  }, [players]);

  useEffect(() => {
    console.log("📡 Joining room:", id);

    socket.emit("join_room", { matchId: id });

    const handleMatchStart = ({ matchId }) => {
      console.log("🔥 MATCH START RECEIVED:", matchId);

      if (String(matchId) === String(id)) {
        navigate(`/problem/${matchId}`, {
          state: { players: playersRef.current, playersNames: playersNamesRef.current },
        });
      }
    };

    socket.on("match_start", handleMatchStart);

    return () => {
      socket.off("match_start", handleMatchStart);
    };
  }, [id, navigate]);

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