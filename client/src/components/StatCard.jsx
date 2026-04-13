import CountUp from 'react-countup';
import { motion } from 'framer-motion';

function StatCard({ label, value, accent, delay = 0, styleAccent = "from-white/10" }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="arena-panel p-5 relative overflow-hidden group"
    >
      <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${styleAccent} to-transparent opacity-50`} />
      <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/5 rounded-full blur-xl group-hover:bg-white/10 transition-colors" />
      <div className="text-sm uppercase tracking-[0.25em] text-paper-200/45 relative z-10">{label}</div>
      <div className={`mt-3 text-4xl font-black ${accent} relative z-10`}>
        <CountUp end={value || 0} duration={2.5} separator="," />
      </div>
    </motion.div>
  );
}

export default StatCard;
