export default function KPICard({ label, value, accent = "text-white", sub }) {
  return (
    <div className="bg-panel border border-border rounded-lg p-5 flex-1 min-w-[160px]">
      <div className="text-muted text-xs uppercase tracking-wider">{label}</div>
      <div className={`text-3xl font-semibold mt-2 font-mono ${accent}`}>{value}</div>
      {sub && <div className="text-muted text-xs mt-1">{sub}</div>}
    </div>
  );
}
