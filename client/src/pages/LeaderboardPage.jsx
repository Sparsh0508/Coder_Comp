import { useEffect, useState } from "react";

import { fetchLeaderboard } from "../services/leaderboardService";

function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchLeaderboard()
      .then((response) => setLeaderboard(response.leaderboard))
      .catch((requestError) => setError(requestError.message));
  }, []);

  return (
    <div className="arena-panel overflow-hidden">
      <div className="border-b border-white/10 px-6 py-5">
        <div className="text-xs uppercase tracking-[0.25em] text-paper-200/45">Global Ranking</div>
        <h1 className="mt-2 text-3xl font-bold">Leaderboard</h1>
      </div>

      {error ? <div className="p-6 text-red-200">{error}</div> : null}

      <div className="overflow-x-auto">
        <table className="min-w-full text-left">
          <thead className="bg-white/5 text-xs uppercase tracking-[0.2em] text-paper-200/45">
            <tr>
              <th className="px-6 py-4">Rank</th>
              <th className="px-6 py-4">Player</th>
              <th className="px-6 py-4">Rating</th>
              <th className="px-6 py-4">Wins</th>
              <th className="px-6 py-4">Losses</th>
              <th className="px-6 py-4">Matches</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((player) => (
              <tr key={player.id} className="border-t border-white/5">
                <td className="px-6 py-4 font-semibold text-arena-400">{player.rank}</td>
                <td className="px-6 py-4">{player.username}</td>
                <td className="px-6 py-4">{player.rating}</td>
                <td className="px-6 py-4">{player.wins}</td>
                <td className="px-6 py-4">{player.losses}</td>
                <td className="px-6 py-4">{player.totalMatches}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default LeaderboardPage;
