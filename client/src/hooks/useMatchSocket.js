import { useEffect, useRef, useState } from "react";

import { getSocket } from "../services/socket";

function useMatchSocket({ roomId, onOpponentUpdate, onSubmissionResult, onMatchEnd }) {
  const [connectionMessage, setConnectionMessage] = useState("Connected to live arena.");
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    const socket = getSocket();

    if (!socket.connected) {
      socket.connect();
    }

    function handleConnect() {
      setConnectionMessage("Connected to live arena.");
    }

    function handleConnectError() {
      setConnectionMessage("Realtime connection unavailable. Retry shortly.");
    }

    function handleCodeUpdate(payload) {
      if (typingTimeoutRef.current) {
        window.clearTimeout(typingTimeoutRef.current);
      }

      onOpponentUpdate?.(payload);

      if (payload.isTyping) {
        typingTimeoutRef.current = window.setTimeout(() => {
          onOpponentUpdate?.({ ...payload, isTyping: false });
        }, 1500);
      }
    }

    socket.on("connect", handleConnect);
    socket.on("connect_error", handleConnectError);
    socket.on("codeUpdate", handleCodeUpdate);
    socket.on("submissionResult", onSubmissionResult);
    socket.on("matchEnd", onMatchEnd);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("connect_error", handleConnectError);
      socket.off("codeUpdate", handleCodeUpdate);
      socket.off("submissionResult", onSubmissionResult);
      socket.off("matchEnd", onMatchEnd);
    };
  }, [onMatchEnd, onOpponentUpdate, onSubmissionResult]);

  useEffect(() => {
    if (!roomId) {
      return;
    }

    const socket = getSocket();
    socket.emit("joinMatchRoom", { roomId });
  }, [roomId]);

  const emitCodeUpdate = ({ language, isTyping }) => {
    if (!roomId) {
      return;
    }
    const socket = getSocket();
    socket.emit("codeUpdate", { roomId, language, isTyping });
  };

  return {
    connectionMessage,
    emitCodeUpdate,
  };
}

export default useMatchSocket;
