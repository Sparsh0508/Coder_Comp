import { Link } from "react-router-dom";
import { ArrowRight, Activity, Clock, Zap, Target } from "lucide-react";
import { motion } from "framer-motion";

import StatCard from "../components/StatCard";
import { useAuth } from "../context/AuthContext";

function DashboardPage() {
  const { user } = useAuth();
  
  const matchHistory = [
    { id: 1, result: "W", opponent: "alex_dev", problem: "Two Sum Data Structure", ratingChange: "+14" },
    { id: 2, result: "L", opponent: "code_ninja", problem: "Valid Parentheses", ratingChange: "-12" },
    { id: 3, result: "W", opponent: "frontend_god", problem: "Merge K Sorted", ratingChange: "+22" },
  ];

  return (
    <div className="space-y-10">
     
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold">
            Welcome back, <span className="text-arena-400">{user?.username}</span>
          </h1>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-arena-500/40 bg-arena-500/10 px-4 py-2 shadow-[0_0_20px_rgba(61,217,184,0.2)]">
          <span className="text-sm font-semibold uppercase tracking-widest text-arena-400">ELO Rating</span>
          <span className="text-xl font-black text-white">{user?.rating ?? 1200}</span>
          <Zap className="text-yellow-400" size={18} fill="#facc15" />
        </div>
      </motion.div>
      <section className="grid gap-6 md:grid-cols-3">
        <StatCard label="Wins" value={user?.wins ?? 0} accent="text-arena-400" styleAccent="from-arena-500" delay={0.1} />
        <StatCard label="Losses" value={user?.losses ?? 0} accent="text-flame-400" styleAccent="from-flame-500" delay={0.2} />
        <StatCard label="Coin Balance" value={user?.coinBalance ?? 0} accent="text-yellow-400" styleAccent="from-yellow-400" delay={0.3} />
      </section>

      <motion.section 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4 }}
        className="relative overflow-hidden rounded-[2rem] border border-arena-500/30 bg-arena-900/50 p-12 text-center backdrop-blur-xl shadow-[0_0_60px_rgba(61,217,184,0.1)]"
      >
        
        <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full border border-arena-500/20 blur-[2px] animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite]" />
        <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-arena-500/10 to-transparent blur-3xl mix-blend-screen" />
        
        <div className="relative z-10 flex flex-col items-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-arena-500/30 bg-arena-500/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-arena-400">
            <Activity size={14} className="animate-pulse" /> Live Arena Open
          </div>
          <h2 className="mb-8 text-4xl font-black text-white drop-shadow-md">
            Prove your algorithmic mastery.
          </h2>
          <Link
            to="/matchmaking"
            className="group relative inline-flex items-center justify-center overflow-hidden rounded-full bg-gradient-to-r from-arena-500 to-arena-400 px-10 py-5 text-lg font-bold text-arena-950 shadow-[0_0_40px_rgba(61,217,184,0.4)] transition-all duration-300 hover:scale-105 hover:shadow-[0_0_60px_rgba(61,217,184,0.6)]"
          >
            <span className="relative z-10 flex items-center gap-3">
              <Target size={24} />
              Find Match
              <ArrowRight size={24} className="transition-transform group-hover:translate-x-1" />
            </span>
            <div className="absolute inset-0 z-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-hover:animate-[shimmer_1.5s_infinite]" />
          </Link>
        </div>
      </motion.section>

      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="mb-6 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-xl font-bold uppercase tracking-widest text-paper-200/80">
            <Clock size={20} /> Recent Battles
          </h3>
          <Link to="/profile" className="text-sm font-medium text-arena-400 hover:text-arena-500 transition-colors">
            View full history &rarr;
          </Link>
        </div>
        
        <div className="grid gap-4 md:grid-cols-3">
          {matchHistory.map((match, i) => {
            const isWin = match.result === "W";
            return (
              <div 
                key={match.id} 
                className="arena-panel group flex flex-col justify-between p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_40px_rgba(61,217,184,0.15)]"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="flex items-center justify-between">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl font-black text-lg ${isWin ? 'bg-arena-500/20 text-arena-400 border border-arena-500/30' : 'bg-flame-500/20 text-flame-400 border border-flame-500/30'}`}>
                    {match.result}
                  </div>
                  <div className={`font-mono font-bold ${isWin ? 'text-arena-400' : 'text-flame-400'}`}>
                    {match.ratingChange}
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-sm font-medium text-paper-200/60 uppercase tracking-wider">vs {match.opponent}</div>
                  <div className="mt-1 text-lg font-bold text-white group-hover:text-arena-400 transition-colors truncate">
                    {match.problem}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </motion.section>
    </div>
  );
}

export default DashboardPage;
