function StatCard({ label, value, accent }) {
  return (
    <div className="arena-panel p-5">
      <div className="text-sm uppercase tracking-[0.25em] text-paper-200/45">{label}</div>
      <div className={`mt-3 text-3xl font-bold ${accent}`}>{value}</div>
    </div>
  );
}

export default StatCard;
