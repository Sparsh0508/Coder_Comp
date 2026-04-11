import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import QueueStatusCard from "../components/QueueStatusCard";
import { getSocket } from "../services/socket";
import { findMatch, leaveQueue } from "../services/matchService";

function MatchmakingPage() {
  const navigate = useNavigate();
  const [queueState, setQueueState] = useState({
    searching: false,
    queueSize: 0,
    message: "Queue up to begin.",
  });

  useEffect(() => {
    const socket = getSocket();

    function handleQueueJoined(payload) {
      setQueueState((current) => ({
        ...current,
        searching: true,
        queueSize: payload.queueSize,
        message: payload.message,
      }));
    }

    function handleMatchFound(payload) {
      setQueueState((current) => ({
        ...current,
        searching: false,
        message: `Matched with ${payload.opponent.username}`,
      }));
      navigate(`/match/${payload.matchId}`);
    }

    function handleQueueError(payload) {
      setQueueState((current) => ({
        ...current,
        searching: false,
        message: payload.message,
      }));
    }

    socket.on("queueJoined", handleQueueJoined);
    socket.on("matchFound", handleMatchFound);
    socket.on("queueError", handleQueueError);

    return () => {
      socket.off("queueJoined", handleQueueJoined);
      socket.off("matchFound", handleMatchFound);
      socket.off("queueError", handleQueueError);
    };
  }, [navigate]);

  const handleFindMatch = async () => {
    const socket = getSocket();

    if (!socket.connected) {
      socket.connect();
      await new Promise((resolve, reject) => {
        const timeoutId = window.setTimeout(() => reject(new Error("Unable to establish realtime connection")), 5000);
        socket.once("connect", () => {
          window.clearTimeout(timeoutId);
          resolve();
        });
        socket.once("connect_error", () => {
          window.clearTimeout(timeoutId);
          reject(new Error("Realtime connection failed"));
        });
      });
    }

    setQueueState((current) => ({
      ...current,
      searching: true,
      message: "Requesting a duel...",
    }));

    try {
      const response = await findMatch({ socketId: socket.id });
      setQueueState((current) => ({
        ...current,
        searching: true,
        queueSize: response.queueSize,
        message: response.message,
      }));
    } catch (error) {
      setQueueState((current) => ({
        ...current,
        searching: false,
        message: error.message,
      }));
    }
  };

  const handleCancel = async () => {
    const socket = getSocket();
    socket.emit("leaveQueue");
    await leaveQueue();
    setQueueState({
      searching: false,
      queueSize: 0,
      message: "You left the queue.",
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.3fr_0.8fr]">
      <QueueStatusCard queueState={queueState} onFindMatch={handleFindMatch} onCancel={handleCancel} />
      <div className="arena-panel p-8">
        <div className="mb-4 text-xs uppercase tracking-[0.25em] text-paper-200/45">How it works</div>
        <div className="space-y-4 text-sm leading-7 text-paper-200/70">
          <p>1. Click Find Match to join the live queue.</p>
          <p>2. We pair you with another online player and assign the same problem.</p>
          <p>3. Run against samples, submit against hidden tests, and win by finishing first with a correct solution.</p>
        </div>
      </div>
    </div>
  );
}

export default MatchmakingPage;
