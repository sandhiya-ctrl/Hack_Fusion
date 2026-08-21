import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import RiskBadge from "../components/RiskBadge.jsx";
import { getRecordDetail, updateReview } from "../services/api.js";

export default function RecordDetails() {
  const { recordId } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [savingReview, setSavingReview] = useState(false);

  useEffect(() => {
    getRecordDetail(recordId)
      .then(({ data }) => setData(data))
      .catch(() => setError("Record not found"));
  }, [recordId]);

  if (error) return <div className="p-8 text-critical">{error}</div>;
  if (!data) return <div className="p-8 text-muted">Loading…</div>;

  const { record, anomaly } = data;
  const d = record?.data || {};
  const saveReview = async (review) => {
    setSavingReview(true);
    try {
      const { data: response } = await updateReview(recordId, review);
      setData((current) => ({ ...current, anomaly: response.anomaly }));
    } finally {
      setSavingReview(false);
    }
  };

  return (
    <div>
      <Navbar title={`Record ${recordId}`} subtitle="Full anomaly breakdown" />
      <div className="p-8 max-w-4xl space-y-6">
        <Link to="/anomalies" className="text-accent text-sm hover:underline">← Back to Anomaly Explorer</Link>

        <div className="bg-panel border border-border rounded-lg p-6 flex items-center justify-between">
          <div>
            <div className="text-muted text-xs uppercase tracking-wider">Overall Risk</div>
            <div className="mt-2"><RiskBadge risk={anomaly.risk} /></div>
          </div>
          <div className="text-right">
            <div className="text-muted text-xs uppercase tracking-wider">Final Score</div>
            <div className="text-4xl font-mono mt-1">{anomaly.finalScore}<span className="text-muted text-lg">/100</span></div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <ScoreCard label="Rule Score" value={anomaly.ruleScore} />
          <ScoreCard label="Statistical Score" value={anomaly.statisticalScore} />
          <ScoreCard label="ML Score" value={anomaly.mlScore} />
        </div>

        <div className="bg-panel border border-border rounded-lg p-6">
          <h3 className="text-sm font-medium text-muted uppercase tracking-wider mb-3">Record Data</h3>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <Field label="District" value={record.district} />
            <Field label="Enumerator" value={record.enumeratorId} />
            <Field label="Survey Date" value={record.surveyDate} />
            <Field label="Age" value={d.age} />
            <Field label="Gender" value={d.gender} />
            <Field label="Education" value={d.education} />
            <Field label="Employment" value={d.employmentStatus} />
            <Field label="Household Size" value={d.householdSize} />
            <Field label="Weekly Hours" value={d.weeklyHours} />
            <Field label="Monthly Income" value={d.monthlyIncome ? `₹${d.monthlyIncome.toLocaleString()}` : "-"} />
          </div>
        </div>

        <div className="bg-panel border border-border rounded-lg p-6">
          <h3 className="text-sm font-medium text-muted uppercase tracking-wider mb-3">Why Flagged</h3>
          <ul className="space-y-2">
            {anomaly.flags?.map((f, i) => (
              <li key={i} className="text-sm flex gap-2">
                <span className="text-warning">⚠</span> {f}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-panel2 border border-accent/30 rounded-lg p-5">
          <div className="text-xs text-muted uppercase tracking-wider mb-1">Recommendation</div>
          <div className="text-sm">{anomaly.recommendation}</div>
        </div>

        <ReviewPanel anomaly={anomaly} onSave={saveReview} saving={savingReview} />
      </div>
    </div>
  );
}

function ReviewPanel({ anomaly, onSave, saving }) {
  const [review, setReview] = useState({
    reviewStatus: anomaly.reviewStatus || "NEW",
    assignedTo: anomaly.assignedTo || "",
    priority: anomaly.priority || "MEDIUM",
    reviewerNotes: anomaly.reviewerNotes || "",
  });

  useEffect(() => {
    setReview({ reviewStatus: anomaly.reviewStatus || "NEW", assignedTo: anomaly.assignedTo || "", priority: anomaly.priority || "MEDIUM", reviewerNotes: anomaly.reviewerNotes || "" });
  }, [anomaly]);

  return (
    <div className="bg-panel border border-border rounded-lg p-6 space-y-4">
      <div>
        <h3 className="text-sm font-medium text-muted uppercase tracking-wider">Review Case</h3>
        <p className="text-xs text-muted mt-1">Assign, assess, and retain the decision history for this alert.</p>
      </div>
      <div className="grid sm:grid-cols-3 gap-3">
        <Select label="Status" value={review.reviewStatus} onChange={(reviewStatus) => setReview({ ...review, reviewStatus })} options={["NEW", "UNDER_REVIEW", "CONFIRMED", "FALSE_POSITIVE", "RESOLVED"]} />
        <Select label="Priority" value={review.priority} onChange={(priority) => setReview({ ...review, priority })} options={["LOW", "MEDIUM", "HIGH"]} />
        <label className="text-xs text-muted">Assigned to<input value={review.assignedTo} onChange={(e) => setReview({ ...review, assignedTo: e.target.value })} placeholder="Reviewer name" className="mt-1 w-full bg-panel2 border border-border rounded px-3 py-2 text-sm text-white" /></label>
      </div>
      <label className="block text-xs text-muted">Review notes<textarea value={review.reviewerNotes} onChange={(e) => setReview({ ...review, reviewerNotes: e.target.value })} placeholder="Explain the review decision…" rows="3" className="mt-1 w-full bg-panel2 border border-border rounded px-3 py-2 text-sm text-white" /></label>
      <button onClick={() => onSave(review)} disabled={saving} className="bg-accent text-ink rounded px-4 py-2 text-sm font-medium disabled:opacity-60">{saving ? "Saving…" : "Save review"}</button>
      {anomaly.reviewHistory?.length > 0 && <div className="border-t border-border pt-4"><div className="text-xs text-muted uppercase tracking-wider mb-2">Review History</div><div className="space-y-2">{[...anomaly.reviewHistory].reverse().map((item, i) => <div key={item._id || i} className="text-xs bg-panel2 rounded p-2"><span className="text-accent">{item.status?.replaceAll("_", " ")}</span>{item.assignedTo && ` · ${item.assignedTo}`}{item.notes && <div className="text-muted mt-1">{item.notes}</div>}</div>)}</div></div>}
    </div>
  );
}

function Select({ label, value, onChange, options }) {
  return <label className="text-xs text-muted">{label}<select value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full bg-panel2 border border-border rounded px-3 py-2 text-sm text-white">{options.map((option) => <option key={option} value={option}>{option.replaceAll("_", " ")}</option>)}</select></label>;
}

function ScoreCard({ label, value }) {
  return (
    <div className="bg-panel border border-border rounded-lg p-5">
      <div className="text-muted text-xs uppercase tracking-wider">{label}</div>
      <div className="text-2xl font-mono mt-2">{value}</div>
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <div className="text-muted text-xs">{label}</div>
      <div className="mt-0.5">{value ?? "-"}</div>
    </div>
  );
}
