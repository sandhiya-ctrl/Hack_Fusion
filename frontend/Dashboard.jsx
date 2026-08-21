import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import Navbar from "../components/Navbar.jsx";
import KPICard from "../components/KPICard.jsx";
import { getDashboardStats, getDistrictAnalysis, getEnumeratorAnalysis } from "../services/api.js";

const SURVEY_ID = "PLFS_2026";
const RISK_COLORS = { CRITICAL: "#F0546B", WARNING: "#F0A63F", NORMAL: "#3FC98E" };

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [reviewStatus, setReviewStatus] = useState("");
  const [districts, setDistricts] = useState([]);
  const [enumerators, setEnumerators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      getDashboardStats(SURVEY_ID),
      getDistrictAnalysis(SURVEY_ID),
      getEnumeratorAnalysis(SURVEY_ID),
    ])
      .then(([b, d, e]) => {
        setStats(b.data);
        setDistricts(d.data);
        setEnumerators(e.data);
      })
      .catch(() => setError("No validation run yet. Upload data and run validation to see results."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    getDashboardStats(SURVEY_ID, reviewStatus ? { reviewStatus } : {})
      .then(({ data }) => setStats(data));
  }, [reviewStatus]);

  const pieData = stats
    ? [
        { name: "Normal", value: stats.totalRecords - stats.anomalies, color: RISK_COLORS.NORMAL },
        { name: "Warning", value: stats.warning, color: RISK_COLORS.WARNING },
        { name: "Critical", value: stats.critical, color: RISK_COLORS.CRITICAL },
      ]
    : [];

  return (
    <div>
      <Navbar title="Dashboard" subtitle="PLFS 2026 · Intelligent Validation Overview" />
      <div className="p-8 space-y-8">
        {loading && <div className="text-muted">Loading dashboard…</div>}
        {error && !loading && (
          <div className="bg-panel border border-border rounded-lg p-8 text-center text-muted">
            {error}
          </div>
        )}

        {stats && (
          <>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="text-xs text-muted">Dashboard metrics update from live review decisions.</div>
              <select value={reviewStatus} onChange={(event) => setReviewStatus(event.target.value)} className="bg-panel border border-border rounded px-3 py-1.5 text-xs text-white">
                <option value="">All review statuses</option>
                {["NEW", "UNDER_REVIEW", "CONFIRMED", "FALSE_POSITIVE", "RESOLVED"].map((status) => <option key={status} value={status}>{status.replaceAll("_", " ")}</option>)}
              </select>
            </div>
            <div className="flex gap-4 flex-wrap">
              <KPICard label="Total Records" value={stats.totalRecords?.toLocaleString()} />
              <KPICard label="Anomalies Detected" value={stats.anomalies?.toLocaleString()} accent="text-warning" />
              <KPICard label="Critical" value={stats.critical?.toLocaleString()} accent="text-critical" />
              <KPICard label="Anomaly Rate" value={`${stats.anomalyRate}%`} accent="text-accent" />
              <KPICard label="New Reviews" value={(stats.reviewStatusCounts?.NEW || 0).toLocaleString()} sub="Awaiting review" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-panel border border-border rounded-lg p-6">
                <h3 className="text-sm font-medium mb-4 text-muted uppercase tracking-wider">Risk Distribution</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={95} paddingAngle={3}>
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: "#16263A", border: "1px solid #22374F" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-panel border border-border rounded-lg p-6">
                <h3 className="text-sm font-medium mb-4 text-muted uppercase tracking-wider">Anomaly Rate by District</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={districts}>
                    <CartesianGrid stroke="#22374F" vertical={false} />
                    <XAxis dataKey="district" stroke="#7C93AC" fontSize={12} />
                    <YAxis stroke="#7C93AC" fontSize={12} />
                    <Tooltip contentStyle={{ background: "#16263A", border: "1px solid #22374F" }} />
                    <Bar dataKey="anomalyRate" fill="#3FA9F5" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-panel border border-border rounded-lg p-6">
              <h3 className="text-sm font-medium mb-4 text-muted uppercase tracking-wider">Top Risky Enumerators</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={[...enumerators].sort((a, b) => b.anomalyRate - a.anomalyRate).slice(0, 8)} layout="vertical">
                  <CartesianGrid stroke="#22374F" horizontal={false} />
                  <XAxis type="number" stroke="#7C93AC" fontSize={12} />
                  <YAxis type="category" dataKey="enumeratorId" stroke="#7C93AC" fontSize={12} width={70} />
                  <Tooltip contentStyle={{ background: "#16263A", border: "1px solid #22374F" }} />
                  <Bar dataKey="anomalyRate" fill="#F0546B" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
