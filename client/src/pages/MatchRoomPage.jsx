import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import EditorPanel from "../components/EditorPanel";
import OpponentPanel from "../components/OpponentPanel";
import ProblemPanel from "../components/ProblemPanel";
import ResultBanner from "../components/ResultBanner";
import { useAuth } from "../context/AuthContext";
import useCountdown from "../hooks/useCountdown";
import useMatchSocket from "../hooks/useMatchSocket";
import { forfeitMatch, getMatchById, timeoutMatch } from "../services/matchService";
import { runSubmission, submitSubmission } from "../services/submissionService";

const defaultTemplates = {
  cpp: "#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    \n    return 0;\n}\n",
  java: "import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        \n    }\n}\n",
  python: "def main():\n    pass\n\nif __name__ == '__main__':\n    main()\n",
};

function formatResultOutput(result) {
  if (Number.isInteger(result?.hiddenTotalCount)) {
    const sampleTotal = Math.max(0, (result.totalCount || 0) - result.hiddenTotalCount);
    const samplePassed = Math.max(0, (result.passedCount || 0) - result.hiddenPassedCount);

    return [
      `Hidden test cases: ${result.hiddenPassedCount}/${result.hiddenTotalCount} passed`,
      `Sample test cases: ${samplePassed}/${sampleTotal} passed`,
      `Total test cases: ${result.passedCount}/${result.totalCount} passed`,
      `Status: ${result.allPassed ? "Accepted" : "Failed"}`,
    ].join("\n");
  }

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

function formatProgressOutput(progress) {
  const sampleTotal = Math.max(0, (progress.totalTests || 0) - progress.hiddenTotalCount);
  const sampleCompleted = Math.min(sampleTotal, progress.completedTests || 0);
  const samplePassed = Math.max(0, (progress.passedTests || 0) - progress.hiddenPassedCount);

  return [
    "Submitting...",
    `Hidden test cases: ${progress.hiddenPassedCount}/${progress.hiddenTotalCount} passed`,
    `Hidden checked: ${progress.hiddenCompletedCount}/${progress.hiddenTotalCount}`,
    `Sample test cases: ${samplePassed}/${sampleTotal} passed`,
    `Sample checked: ${sampleCompleted}/${sampleTotal}`,
    `Total checked: ${progress.completedTests}/${progress.totalTests}`,
  ].join("\n");
}

function MatchRoomPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { matchId } = useParams();
  const { user, refreshUser, updateUser } = useAuth();
  const [match, setMatch] = useState(null);
  const [language, setLanguage] = useState("cpp");
  const [code, setCode] = useState(defaultTemplates.cpp);
  const [output, setOutput] = useState("");
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [notice, setNotice] = useState(location.state?.notice || "");
  const loadedMatchIdRef = useRef(null);
  const hasNavigatedToResultRef = useRef(false);
  const hasHandledTimeoutRef = useRef(false);

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
    onSubmissionProgress(payload) {
      setMatch((current) => {
        if (!current) {
          return current;
        }

        const rosterPayload = {
          ...payload,
          hasSubmitted: true,
          isTyping: false,
          status: "submitted",
        };

        if (payload.userId === current.currentPlayer?.id) {
          setOutput(formatProgressOutput(payload));
          return {
            ...current,
            currentPlayer: {
              ...current.currentPlayer,
              passedTests: payload.passedTests,
              totalTests: payload.totalTests,
              hasSubmitted: true,
              status: "submitted",
            },
          };
        }

        return {
          ...current,
          teammates: updateRosterPlayer(current.teammates || [], rosterPayload),
          opponents: updateRosterPlayer(current.opponents || [], rosterPayload),
        };
      });
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
      if (hasHandledTimeoutRef.current) {
        return;
      }

      hasHandledTimeoutRef.current = true;

      timeoutMatch(matchId)
        .then((response) => {
          setResult(response.result);
          refreshUser().catch(() => {});
          if (!hasNavigatedToResultRef.current) {
            hasNavigatedToResultRef.current = true;
            navigate(`/match/${matchId}/result`, { state: { result: response.result }, replace: true });
          }
        })
        .catch(() => {
          // Even if the API fails (server crash/network), move the player out of the editor UI.
          const fallback = {
            winnerTeam: null,
            winnerId: null,
            prizePool: match?.prizePool ?? 0,
            perWinnerReward: 0,
            reason: "Time ran out. Unable to finalize match cleanup, please refresh.",
          };

          setResult(fallback);
          refreshUser().catch(() => {});

          if (!hasNavigatedToResultRef.current) {
            hasNavigatedToResultRef.current = true;
            navigate(`/match/${matchId}/result`, { state: { result: fallback }, replace: true });
          }
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
    setOutput("Submitting...\nWaiting for judge progress.");
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
      {notice ? (
        <div className="mb-4 rounded-2xl border border-arena-500/30 bg-arena-500/10 px-4 py-3 text-sm text-arena-200">
          {notice}
        </div>
      ) : null}

      <div className="grid h-full gap-4 xl:grid-cols-[0.8fr_1.2fr]">
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
          <div className="min-h-0 lg:overflow-hidden">
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
            <button
              className="arena-button-secondary"
              onClick={async () => {
                try {
                  const response = await forfeitMatch(matchId);
                  setResult(response.result);
                } catch {}
                refreshUser().catch(() => {});
                navigate("/dashboard");
              }}
            >
              Leave arena
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default MatchRoomPage;
