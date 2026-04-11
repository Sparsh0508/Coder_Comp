import { Link } from "react-router-dom";
import { ArrowRight, Code2, Radar, Trophy } from "lucide-react";

import StatCard from "../components/StatCard";
import { useAuth } from "../context/AuthContext";

function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <section className="arena-panel grid gap-8 p-8 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <div className="inline-flex rounded-full border border-arena-500/30 bg-arena-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-arena-400">
            Arena Control Center
          </div>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-tight">
            Race another coder to a clean submission and let the hidden tests decide the winner.
          </h1>
          <p className="mt-4 max-w-2xl text-paper-200/65">
            Queue for a live duel, solve the same algorithmic challenge, and climb the global leaderboard with every win.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link className="arena-button-primary gap-2" to="/matchmaking">
              Find Match
              <ArrowRight size={18} />
            </Link>
            <Link className="arena-button-secondary gap-2" to="/leaderboard">
              View Leaderboard
              <Trophy size={18} />
            </Link>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="rounded-3xl border border-white/10 bg-arena-900/85 p-5">
            <div className="flex items-center gap-3">
              <Radar className="text-arena-400" size={20} />
              <span className="text-sm uppercase tracking-[0.22em] text-paper-200/50">Player Snapshot</span>
            </div>
            <div className="mt-5 text-2xl font-bold">{user?.username}</div>
            <div className="mt-1 text-paper-200/65">Ready to duel</div>
            <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-2xl border border-white/10 bg-black/15 p-3">
                <div className="text-paper-200/45">Rating</div>
                <div className="mt-2 text-lg font-semibold">{user?.rating}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/15 p-3">
                <div className="text-paper-200/45">Matches</div>
                <div className="mt-2 text-lg font-semibold">{user?.totalMatches}</div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-flame-500/15 to-transparent p-5">
            <div className="flex items-center gap-3">
              <Code2 className="text-flame-400" size={20} />
              <span className="text-sm uppercase tracking-[0.22em] text-paper-200/50">Battle Rules</span>
            </div>
            <p className="mt-4 text-sm leading-7 text-paper-200/70">
              Passing every test case wins immediately. If both solvers finish, the faster accepted submission takes the duel.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label="Current Rating" value={user?.rating ?? 1200} accent="text-arena-400" />
        <StatCard label="Wins" value={user?.wins ?? 0} accent="text-flame-400" />
        <StatCard label="Losses" value={user?.losses ?? 0} accent="text-paper-100" />
      </section>
    </div>
  );
}

export default DashboardPage;
