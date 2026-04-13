import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { socket } from "../socket";

const Matchmaking = () => {
  const navigate = useNavigate();

  useEffect(() => {
    socket.emit("join_queue");

    const handleMatchFound = (data) => {
      console.log(" MATCH FOUND:", data);

      navigate(`/match/${data.matchId}`, {
        state: { players: data.players },
      });
    };

    socket.on("match_found", handleMatchFound);

    return () => {
      socket.off("match_found", handleMatchFound);
    };
  }, [navigate]);

  return (
    <div className="h-screen flex items-center justify-center bg-gray-900 text-white">
      <h1 className="text-2xl animate-pulse">🔍 Finding Match...</h1>
    </div>
  );
};

export default Matchmaking;