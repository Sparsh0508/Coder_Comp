import CodeEditor from "../pages/CodeEditor";
import { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import { getMatchById } from "../services/matchService";

const Problem = () => {
  const { id } = useParams();
  const location = useLocation();
  const [problem, setProblem] = useState(null);
  const [matchDetails, setMatchDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const players = location.state?.playersNames || [];

  useEffect(() => {
    let isMounted = true;
    const fetchMatchProblem = async () => {
      try {
        setLoading(true);
        const response = await getMatchById(id);
        if (isMounted && response?.match) {
          setMatchDetails(response.match);
          if (response.match.problem) {
            setProblem(response.match.problem);
          } else {
            setErrorMsg("No problem assigned to this match.");
          }
        }
      } catch (error) {
        console.error("Error loading match problem:", error);
        if (isMounted) {
          setErrorMsg(error.message || "Failed to load match problem.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchMatchProblem();
    return () => {
      isMounted = false;
    };
  }, [id]);

  const myUsername = matchDetails?.currentPlayer?.username || players[0] || "Player 1";
  const opponentUsername = matchDetails?.opponents?.map((o) => o.username).join(", ") || players[1] || "Player 2";

  if (loading) {
    return (
      <div className="h-screen bg-[#0f172a] text-white flex items-center justify-center">
        <div className="text-xl animate-pulse">Loading problem...</div>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="h-screen bg-[#0f172a] text-white flex items-center justify-center">
        <div className="text-xl text-red-500 font-semibold">{errorMsg}</div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-5 h-screen bg-[#0f172a] text-white overflow-hidden">
      <div className="col-span-2 border-r border-gray-700 p-4 overflow-auto">
        <h1 className="text-xl font-bold mb-3">
          {problem?.title} ⚔️ Match #{id}
        </h1>

        <p className="text-gray-300 text-sm mb-4 leading-relaxed whitespace-pre-wrap">
          {problem?.description}
        </p>

        {(problem?.sampleInput || problem?.sampleOutput) && (
          <>
            <h3 className="font-semibold mt-4">Example</h3>
            <pre className="bg-black p-3 rounded text-xs mt-2 whitespace-pre-wrap">
              {`Input: ${problem?.sampleInput || ""}
Output: ${problem?.sampleOutput || ""}`}
            </pre>
          </>
        )}

        {problem?.constraints && problem.constraints.length > 0 && (
          <>
            <h3 className="font-semibold mt-4">Constraints</h3>
            <ul className="text-xs text-gray-400 list-disc ml-4 mt-2 space-y-1">
              {problem.constraints.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </>
        )}

        <div className="mt-6 text-sm text-gray-400">
          <p>YOU: {myUsername}</p>
          <p>OPPONENT: {opponentUsername}</p>
        </div>
      </div>

      <div className="col-span-3 flex flex-col">
        <CodeEditor matchId={id} />
      </div>
    </div>
  );
};

export default Problem;