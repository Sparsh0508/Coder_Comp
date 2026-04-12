import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import QueueStatusCard from "../components/QueueStatusCard";
import { getSocket } from "../services/socket";
import { findMatch, leaveQueue } from "../services/matchService";

const entryCoinsByMode = {
  "1v1": 50,
  "2v2": 75,
  "4v4": 100,
};

function MatchmakingPage() {
  const navigate = useNavigate();
  const [selectedMode, setSelectedMode] = useState("1v1");
  const [queueState, setQueueState] = useState({
    searching: false,
    queueSize: 0,
    requiredPlayers: 2,
    spotsLeft: 2,
    message: "Queue up to begin.",
    mode: "1v1",
  });

  useEffect(() => {
    const socket = getSocket();

    function handleQueueJoined(payload) {
      setQueueState((current) => ({
        ...current,
        searching: true,
        queueSize: payload.queueSize,
        requiredPlayers: payload.requiredPlayers ?? current.requiredPlayers,
        spotsLeft: payload.spotsLeft ?? current.spotsLeft,
        message: payload.message,
        mode: payload.mode || current.mode,
      }));
    }

    function handleMatchFound(payload) {
      const opponentSummary =
        payload.opponents?.length > 1
          ? `${payload.opponents[0].username} and ${payload.opponents.length - 1} more`
          : payload.opponents?.[0]?.username || "another team";

      setQueueState((current) => ({
        ...current,
        searching: false,
        message: `Matched in ${payload.mode || current.mode} against ${opponentSummary}`,
        mode: payload.mode || current.mode,
      }));
      navigate(`/match/${payload.matchId}/lobby`);
    }

    function handleQueueError(payload) {
      setQueueState((current) => ({
        ...current,
        searching: false,
        message: payload.message,
      }));
    }

    function handleQueueUpdate(payload) {
      setQueueState((current) => ({
        ...current,
        queueSize: payload.queueSize,
        requiredPlayers: payload.requiredPlayers,
        spotsLeft: payload.spotsLeft,
        mode: payload.mode || current.mode,
        message: payload.queueSize >= payload.requiredPlayers
          ? "Match full. Building lobby..."
          : `Waiting for ${payload.spotsLeft} more player${payload.spotsLeft === 1 ? "" : "s"}.`,
      }));
    }

    socket.on("queueJoined", handleQueueJoined);
    socket.on("matchFound", handleMatchFound);
    socket.on("queueError", handleQueueError);
    socket.on("queueUpdate", handleQueueUpdate);

    return () => {
      socket.off("queueJoined", handleQueueJoined);
      socket.off("matchFound", handleMatchFound);
      socket.off("queueError", handleQueueError);
      socket.off("queueUpdate", handleQueueUpdate);
    };
  }, [navigate]);

  useEffect(() => {
    if (queueState.searching) {
      return;
    }

    const requiredPlayers = selectedMode === "1v1" ? 2 : selectedMode === "2v2" ? 4 : 8;
    setQueueState((current) => ({
      ...current,
      mode: selectedMode,
      requiredPlayers,
      spotsLeft: requiredPlayers,
    }));
  }, [queueState.searching, selectedMode]);

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
      mode: selectedMode,
      requiredPlayers: selectedMode === "1v1" ? 2 : selectedMode === "2v2" ? 4 : 8,
      message: `Requesting a ${selectedMode} match...`,
    }));

    try {
      const response = await findMatch({ socketId: socket.id, mode: selectedMode });
      setQueueState((current) => ({
        ...current,
        searching: true,
        queueSize: response.queueSize,
        requiredPlayers: response.requiredPlayers ?? current.requiredPlayers,
        spotsLeft: response.spotsLeft ?? current.spotsLeft,
        message: response.message,
        mode: response.mode || selectedMode,
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
    socket.emit("leaveQueue", { mode: selectedMode });
    await leaveQueue({ mode: selectedMode });
    setQueueState({
      searching: false,
      queueSize: 0,
      requiredPlayers: selectedMode === "1v1" ? 2 : selectedMode === "2v2" ? 4 : 8,
      spotsLeft: selectedMode === "1v1" ? 2 : selectedMode === "2v2" ? 4 : 8,
      message: "You left the queue.",
      mode: selectedMode,
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.3fr_0.8fr]">
      <QueueStatusCard
        queueState={queueState}
        selectedMode={selectedMode}
        entryCoins={entryCoinsByMode[selectedMode]}
        onModeChange={setSelectedMode}
        onFindMatch={handleFindMatch}
        onCancel={handleCancel}
      />
      <div className="arena-panel p-8">
        <div className="mb-4 text-xs uppercase tracking-[0.25em] text-paper-200/45">How it works</div>
        <div className="space-y-4 text-sm leading-7 text-paper-200/70">
          <p>1. Pick `1v1`, `2v2`, or `4v4`, then join that live queue.</p>
          <p>2. Once the queue is full, everyone moves into a short lobby where entry coins are deducted into a shared prize chest.</p>
          <p>3. After the countdown, the coding match begins and the winning team claims the prize pool.</p>
        </div>
      </div>
    </div>
  );
}

export default MatchmakingPage;
