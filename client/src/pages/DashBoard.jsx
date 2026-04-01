import { useState, useEffect } from "react";
import api from "../utils/api";

const DashBoard = () => {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [matches, setMatches] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  useEffect(() => {
    fetchDashBoard();
  }, []);

  const fetchDashBoard = async () => {
    try {
      const res = await api.get("/dashboard")
      // const res = {
      //   user: {
      //     username: "Rudra",
      //     rank: "Gold II",
      //     rating: 1450,
      //   },
      //   stats: {
      //     total: 50,
      //     wins: 30,
      //     winRate: 60,
      //     streak: 3,
      //   },
      //   recentMatches: [
      //     { id: 1, opponent: "Aman", result: "WIN" },
      //     { id: 2, opponent: "Rohit", result: "LOSS" },
      //   ],
      //   leaderboard: [
      //     { id: 1, username: "ProGamer", rating: 2000 },
      //     { id: 2, username: "Shadow", rating: 1800 },
      //   ],
      // };
      setUser(res.data.user);
      setStats(res.data.stats);
      setMatches(res.data.recentMatches);
      setLeaderboard(res.data.leaderboard);
    } catch (error) {
      console.error("Dashboard fetch failed");
    }
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#020617] to-black text-white p-6 space-y-6">

      {/* TOP GRID */}
      <div className="grid grid-cols-3 gap-6">

        {/* USER CARD */}
        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-5">
          <h2 className="text-2xl font-bold">{user?.username}</h2>
          <p className="text-gray-400">{user?.rank}</p>
          <p className="mt-3 text-yellow-400 font-semibold">
            ⭐ {user?.rating}
          </p>
        </div>

        {/* PLAY CARD */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 flex flex-col justify-center items-center shadow-lg shadow-blue-500/20">
          <h2 className="text-xl font-semibold mb-3">Ready to battle?</h2>

          <button className="bg-white text-blue-600 px-6 py-2 rounded-xl font-bold hover:scale-105 transition">
            Play 1v1 ⚔️
          </button>
        </div>

        {/* STATS CARD */}
        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-5 space-y-1">
          <p>Total Matches: <span className="text-blue-400">{stats?.total}</span></p>
          <p>Wins: <span className="text-green-400">{stats?.wins}</span></p>
          <p>Win Rate: <span className="text-purple-400">{stats?.winRate}%</span></p>
          <p>Streak: 🔥 <span className="text-orange-400">{stats?.streak}</span></p>
        </div>
      </div>

      {/* BOTTOM GRID */}
      <div className="grid grid-cols-2 gap-6">

        {/* LEADERBOARD */}
        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-5">
          <h2 className="text-lg font-bold mb-4 text-blue-400">Top Players</h2>

          {leaderboard.map((player, index) => (
            <div key={player.id} className="flex justify-between py-2 border-b border-white/10">
              <span>#{index + 1} {player.username}</span>
              <span className="text-yellow-400">{player.rating}</span>
            </div>
          ))}

          <button className="mt-4 text-sm text-blue-400 hover:underline">
            View Full Leaderboard →
          </button>
        </div>

        {/* MATCHES */}
        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-5">
          <h2 className="text-lg font-bold mb-4 text-purple-400">Recent Matches</h2>

          {matches.map((match) => (
            <div key={match.id} className="flex justify-between py-2 border-b border-white/10">
              <span>vs {match.opponent}</span>
              <span
                className={
                  match.result === "WIN"
                    ? "text-green-400 font-semibold"
                    : "text-red-400 font-semibold"
                }
              >
                {match.result}
              </span>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
export default DashBoard;