import { useEffect, useMemo, useState } from "react";
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
  const { user } = useAuth();
  const [match, setMatch] = useState(null);
  const [language, setLanguage] = useState("cpp");
  const [code, setCode] = useState(defaultTemplates.cpp);
  const [output, setOutput] = useState("");
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const socketState = useMatchSocket({
    matchId,
    roomId: match?.roomId,
    onOpponentUpdate(payload) {
      setMatch((current) =>
        current
          ? {
              ...current,
              opponent: {
                ...current.opponent,
                language: payload.language || current.opponent?.language,
                isTyping: payload.isTyping,
              },
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
          opponent: {
            ...current.opponent,
            passedTests: payload.passedTests,
            totalTests: payload.totalTests,
            hasSubmitted: true,
            isTyping: false,
          },
        };
      });
    },
    onMatchEnd(payload) {
      setResult(payload);
    },
  });

  useEffect(() => {
    async function loadMatch() {
      const response = await getMatchById(matchId);
      setMatch(response.match);

      const starterCode =
        response.match.problem?.starterCode?.cpp ||
        defaultTemplates.cpp;

      setCode(starterCode);
    }

    loadMatch().catch((error) => {
      setOutput(error.message);
    });
  }, [matchId]);

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
        winnerId: match?.opponent?.id,
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
          reason: response.result.allPassed ? "Accepted solution submitted first." : undefined,
        });
      }
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
      <ResultBanner result={result} userId={user?.id} />

      <div className="grid h-full gap-4 xl:grid-cols-[0.92fr_1.08fr]">
        <div className="min-h-0">
          <ProblemPanel problem={match.problem} />
        </div>

        <div className="grid min-h-0 gap-4">
          <OpponentPanel
            opponent={match.opponent}
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
