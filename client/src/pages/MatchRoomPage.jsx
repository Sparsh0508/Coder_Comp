import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import EditorPanel from "../components/EditorPanel";
import OpponentPanel from "../components/OpponentPanel";
import ProblemPanel from "../components/ProblemPanel";
import ResultBanner from "../components/ResultBanner";
import { useAuth } from "../context/AuthContext";
import useCountdown from "../hooks/useCountdown";
import useMatchSocket from "../hooks/useMatchSocket";
import { getMatchById } from "../services/matchService";
import { runSubmission, submitSubmission } from "../services/submissionService";

const defaultTemplates = {
  cpp: "#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    \n    return 0;\n}\n",
  java: "import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        \n    }\n}\n",
  python: "def main():\n    pass\n\nif __name__ == '__main__':\n    main()\n",
};

function formatResultOutput(result) {
  if (!result?.testCases?.length) {
    return "No execution data yet.";
  }

  return result.testCases
    .map(
      (testCase, index) =>
        `Test ${index + 1}: ${testCase.passed ? "PASS" : "FAIL"}\nExpected: ${testCase.expectedOutput}\nActual: ${testCase.actualOutput}\nStatus: ${testCase.status}`
    )
    .join("\n\n");
}

function MatchRoomPage() {
  const navigate = useNavigate();
  const { matchId } = useParams();
  const { user, refreshUser, updateUser } = useAuth();
  const [match, setMatch] = useState(null);
  const [language, setLanguage] = useState("cpp");
  const [code, setCode] = useState(defaultTemplates.cpp);
  const [output, setOutput] = useState("");
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const loadedMatchIdRef = useRef(null);
  const hasNavigatedToResultRef = useRef(false);

  const updateRosterPlayer = (players, payload) =>
    players.map((player) =>
      player.id === payload.userId
        ? {
            ...player,
            language: payload.language || player.language,
            isTyping: payload.isTyping ?? player.isTyping,
            passedTests: payload.passedTests ?? player.passedTests,
            totalTests: payload.totalTests ?? player.totalTests,
            hasSubmitted: payload.hasSubmitted ?? player.hasSubmitted,
            status: payload.status || player.status,
          }
        : player
    );

  const socketState = useMatchSocket({
    matchId,
    roomId: match?.roomId,
    onMatchStarted() {},
    onLobbyUpdated() {},
    onMatchCancelled(payload) {
      setOutput(payload.reason || "Match cancelled.");
      refreshUser().catch(() => {});
      navigate("/matchmaking");
    },
    onOpponentUpdate(payload) {
      setMatch((current) =>
        current
          ? {
              ...current,
              teammates: updateRosterPlayer(current.teammates || [], payload),
              opponents: updateRosterPlayer(current.opponents || [], payload),
            }
          : current
      );
    },
    onSubmissionResult(payload) {
      setMatch((current) => {
        if (!current) {
          return current;
        }

        if (payload.userId === current.currentPlayer?.id) {
          return {
            ...current,
            currentPlayer: {
              ...current.currentPlayer,
              passedTests: payload.passedTests,
              totalTests: payload.totalTests,
              hasSubmitted: true,
              status: payload.allPassed ? "accepted" : "submitted",
            },
          };
        }

        return {
          ...current,
          teammates: updateRosterPlayer(current.teammates || [], {
            ...payload,
            hasSubmitted: true,
            isTyping: false,
            status: payload.allPassed ? "accepted" : "submitted",
          }),
          opponents: updateRosterPlayer(current.opponents || [], {
            ...payload,
            hasSubmitted: true,
            isTyping: false,
            status: payload.allPassed ? "accepted" : "submitted",
          }),
        };
      });
    },
    onMatchEnd(payload) {
      setResult(payload);
      refreshUser().catch(() => {});
      if (!hasNavigatedToResultRef.current) {
        hasNavigatedToResultRef.current = true;
        navigate(`/match/${matchId}/result`, { state: { result: payload }, replace: true });
      }
    },
  });

  useEffect(() => {
    if (loadedMatchIdRef.current === matchId) {
      return;
    }

    loadedMatchIdRef.current = matchId;

    async function loadMatch() {
      const response = await getMatchById(matchId);

      if (response.match.status === "lobby") {
        navigate(`/match/${matchId}/lobby`, { replace: true });
        return;
      }

      if (response.match.status === "cancelled") {
        navigate("/matchmaking", { replace: true });
        return;
      }

      if (response.match.status === "completed") {
        navigate(`/match/${matchId}/result`, { replace: true });
        return;
      }

      setMatch(response.match);
      if (response.match.currentPlayer?.coinBalance !== undefined) {
        updateUser({ coinBalance: response.match.currentPlayer.coinBalance });
      }

      const starterCode =
        response.match.problem?.starterCode?.cpp ||
        defaultTemplates.cpp;

      setCode(starterCode);
    }

    loadMatch().catch((error) => {
      setOutput(error.message);
    });
  }, [matchId, navigate, updateUser]);

  useEffect(() => {
    if (!match?.problem) {
      return;
    }

    const starter = match.problem.starterCode?.[language] || defaultTemplates[language];
    setCode(starter);
  }, [language, match?.problem]);

  const timer = useCountdown(match?.countdownEndsAt);

  useEffect(() => {
    if (timer === "00:00" && !result && match?.status !== "completed") {
      setResult({
        winnerTeam: match?.currentPlayer?.team === 1 ? 2 : 1,
        reason: "Time ran out before you finished the hidden suite.",
      });
    }
  }, [match, result, timer]);

  const queueMessage = useMemo(() => socketState.connectionMessage, [socketState.connectionMessage]);

  const handleCodeChange = (nextCode) => {
    setCode(nextCode);
    socketState.emitCodeUpdate({ language, isTyping: true });
  };

  const handleRun = async () => {
    setRunning(true);
    try {
      const response = await runSubmission({
        problemId: match.problem._id || match.problem.id,
        code,
        language,
      });
      setOutput(formatResultOutput(response.result));
    } catch (error) {
      setOutput(error.message);
    } finally {
      setRunning(false);
      socketState.emitCodeUpdate({ language, isTyping: false });
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const response = await submitSubmission({
        matchId,
        code,
        language,
      });
      setOutput(formatResultOutput(response.result));
      if (response.match?.winnerId) {
        setResult({
          winnerId: response.match.winnerId,
          winnerTeam: response.match.winnerTeam,
          prizePool: response.match.prizePool,
          rewardedUserIds: response.match.rewardedUserIds,
          perWinnerReward: response.match.perWinnerReward,
          reason: response.result.allPassed ? "Accepted solution submitted first." : undefined,
        });
        if (!hasNavigatedToResultRef.current) {
          hasNavigatedToResultRef.current = true;
          navigate(`/match/${matchId}/result`, {
            state: {
              result: {
                winnerId: response.match.winnerId,
                winnerTeam: response.match.winnerTeam,
                prizePool: response.match.prizePool,
                rewardedUserIds: response.match.rewardedUserIds,
                perWinnerReward: response.match.perWinnerReward,
                reason: response.result.allPassed ? "Accepted solution submitted first." : undefined,
              },
            },
            replace: true,
          });
        }
      }
      refreshUser().catch(() => {});
    } catch (error) {
      setOutput(error.message);
    } finally {
      setSubmitting(false);
      socketState.emitCodeUpdate({ language, isTyping: false });
    }
  };

  if (!match) {
    return <div className="flex h-full items-center justify-center">Loading match...</div>;
  }

  return (
    <>
      <ResultBanner result={result} userId={user?.id} userTeam={match?.currentPlayer?.team} />

      <div className="grid h-full gap-4 xl:grid-cols-[0.92fr_1.08fr]">
        <div className="min-h-0">
          <ProblemPanel problem={match.problem} />
        </div>

        <div className="grid min-h-0 gap-4">
          <OpponentPanel
            mode={match.mode}
            teammates={match.teammates}
            opponents={match.opponents}
            currentPlayer={{ ...match.currentPlayer, username: user?.username, rating: user?.rating }}
            queueMessage={queueMessage}
          />
          <div className="min-h-0">
            <EditorPanel
              language={language}
              code={code}
              onChange={handleCodeChange}
              onLanguageChange={setLanguage}
              onRun={handleRun}
              onSubmit={handleSubmit}
              running={running}
              submitting={submitting}
              output={output}
              timer={timer}
            />
          </div>
          <div className="flex justify-end">
            <button className="arena-button-secondary" onClick={() => navigate("/dashboard")}>
              Leave arena
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default MatchRoomPage;
