import { Link } from "react-router-dom";
import RiskBadge from "./RiskBadge.jsx";

export default function AnomalyTable({ results, onReviewStatusChange, updatingRecordId }) {
  if (!results?.length) {
    return <div className="text-muted text-sm py-10 text-center">No results to show yet.</div>;
  }
  return (
    <div className="overflow-x-auto border border-border rounded-lg">
      <table className="w-full text-sm">
        <thead className="bg-panel2 text-muted text-xs uppercase tracking-wider">
          <tr>
            <th className="text-left px-4 py-3">Record ID</th>
            <th className="text-left px-4 py-3">District</th>
            <th className="text-left px-4 py-3">Enumerator</th>
            <th className="text-left px-4 py-3">Score</th>
            <th className="text-left px-4 py-3">Risk</th>
            <th className="text-left px-4 py-3">Review</th>
            <th className="text-left px-4 py-3">Top Reason</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {results.map((r) => (
            <tr key={r.recordId} className="border-t border-border hover:bg-panel2/50">
              <td className="px-4 py-3 font-mono text-accent">{r.recordId}</td>
              <td className="px-4 py-3">{r.district}</td>
              <td className="px-4 py-3">{r.enumeratorId}</td>
              <td className="px-4 py-3 font-mono">{r.finalScore}</td>
              <td className="px-4 py-3"><RiskBadge risk={r.risk} /></td>
              <td className="px-4 py-3">
                {onReviewStatusChange ? (
                  <select aria-label={`Review status for ${r.recordId}`} value={r.reviewStatus || "NEW"} disabled={updatingRecordId === r.recordId} onChange={(event) => onReviewStatusChange(r, event.target.value)} className="bg-panel2 border border-border rounded px-2 py-1 text-[10px] text-white disabled:opacity-50">
                    {["NEW", "UNDER_REVIEW", "CONFIRMED", "FALSE_POSITIVE", "RESOLVED"].map((status) => <option key={status} value={status}>{status.replaceAll("_", " ")}</option>)}
                  </select>
                ) : <ReviewStatus status={r.reviewStatus} />}
              </td>
              <td className="px-4 py-3 text-muted truncate max-w-xs">{r.flags?.[0]}</td>
              <td className="px-4 py-3">
                <Link to={`/records/${r.recordId}`} className="text-accent hover:underline text-xs">
                  View →
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ReviewStatus({ status = "NEW" }) {
  const label = status.replaceAll("_", " ");
  const styles = {
    NEW: "bg-slate-500/20 text-slate-300",
    UNDER_REVIEW: "bg-blue-500/20 text-blue-300",
    CONFIRMED: "bg-red-500/20 text-red-300",
    FALSE_POSITIVE: "bg-emerald-500/20 text-emerald-300",
    RESOLVED: "bg-purple-500/20 text-purple-300",
  };
  return <span className={`rounded px-2 py-1 text-[10px] font-medium ${styles[status] || styles.NEW}`}>{label}</span>;
}
