import { useEffect } from "react";
import { socket } from "../socket";
import { useNavigate } from "react-router-dom";

const Matchmaking = () => {
  const navigate = useNavigate();

  useEffect(() => {
    socket.emit("join_queue");

    socket.on("match_found", ({ matchId }) => {
      navigate(`/match/${matchId}`);
    });

    return () => socket.off("match_found");
  }, []);

  return (
    <div className="h-screen flex items-center justify-center bg-black text-white">
      <h1 className="text-xl animate-pulse">
        🔍 Finding opponent...
      </h1>
    </div>
  );
};

export default Matchmaking;