import { useEffect, useState } from "react";
import Navbar from "../components/Navbar.jsx";
import AnomalyTable from "../components/AnomalyTable.jsx";
import { getResults, exportReport, updateReview } from "../services/api.js";

const SURVEY_ID = "PLFS_2026";
const PAGE_SIZE = 100;
const REVIEW_STATUSES = ["NEW", "UNDER_REVIEW", "CONFIRMED", "FALSE_POSITIVE", "RESOLVED"];

export default function Anomalies() {
  const [results, setResults] = useState([]);
  const [risk, setRisk] = useState("");
  const [reviewStatus, setReviewStatus] = useState("");
  const [total, setTotal] = useState(0);
  const [statusCounts, setStatusCounts] = useState({});
  const [page, setPage] = useState(0);
  const [updatingRecordId, setUpdatingRecordId] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchResults = () => {
    setLoading(true);
    getResults({ surveyId: SURVEY_ID, ...(risk ? { risk } : {}), ...(reviewStatus ? { reviewStatus } : {}), limit: PAGE_SIZE, skip: page * PAGE_SIZE })
      .then(({ data }) => {
        setResults(data.results);
        setTotal(data.total);
        setStatusCounts(data.reviewStatusCounts || {});
      })
      .finally(() => setLoading(false));
  };

  useEffect(fetchResults, [risk, reviewStatus, page]);
  const changeRisk = (value) => { setPage(0); setRisk(value); };
  const changeReviewStatus = (value) => { setPage(0); setReviewStatus(value); };
  const updateRowStatus = async (result, nextStatus) => {
    setUpdatingRecordId(result.recordId);
    try {
      await updateReview(result.recordId, { reviewStatus: nextStatus });
      fetchResults();
    } finally {
      setUpdatingRecordId(null);
    }
  };
  const from = total === 0 ? 0 : page * PAGE_SIZE + 1;
  const to = Math.min((page + 1) * PAGE_SIZE, total);

  return (
    <div>
      <Navbar title="Anomaly Explorer" subtitle={`${total} scored records`} />
      <div className="p-8 space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex gap-2">
            {["", "CRITICAL", "WARNING", "NORMAL"].map((r) => (
              <button
                key={r}
                onClick={() => changeRisk(r)}
                className={`px-4 py-1.5 rounded text-xs font-medium border transition ${
                  risk === r
                    ? "bg-accent text-ink border-accent"
                    : "border-border text-muted hover:text-white"
                }`}
              >
                {r || "All"}
              </button>
            ))}
          </div>
          <select value={reviewStatus} onChange={(e) => changeReviewStatus(e.target.value)} className="bg-panel border border-border rounded px-3 py-1.5 text-xs text-white">
            <option value="">All review statuses</option>
            {REVIEW_STATUSES.map((status) => <option key={status} value={status}>{status.replaceAll("_", " ")}</option>)}
          </select>
          <a
            href={exportReport({ surveyId: SURVEY_ID, ...(risk ? { risk } : {}) })}
            className="text-xs text-accent hover:underline"
          >
            ⤓ Export CSV
          </a>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {REVIEW_STATUSES.map((status) => <button key={status} onClick={() => changeReviewStatus(status)} className="bg-panel border border-border rounded p-3 text-left hover:border-accent"><div className="text-xl font-mono">{statusCounts[status] || 0}</div><div className="text-[10px] text-muted mt-1">{status.replaceAll("_", " ")}</div></button>)}
        </div>

        {loading ? (
          <div className="text-muted text-sm">Loading…</div>
        ) : (
          <AnomalyTable results={results} onReviewStatusChange={updateRowStatus} updatingRecordId={updatingRecordId} />
        )}
        {!loading && total > 0 && <div className="flex items-center justify-between text-sm"><span className="text-muted">Displaying {from}–{to} of {total} records</span><div className="flex gap-2"><button onClick={() => setPage((current) => current - 1)} disabled={page === 0} className="border border-border rounded px-3 py-1.5 disabled:opacity-40">← Previous</button><button onClick={() => setPage((current) => current + 1)} disabled={to >= total} className="border border-border rounded px-3 py-1.5 disabled:opacity-40">Next →</button></div></div>}
      </div>
    </div>
  );
}
