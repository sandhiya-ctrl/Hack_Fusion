import Navbar from "../components/Navbar.jsx";
import { exportReport } from "../services/api.js";

const SURVEY_ID = "PLFS_2026";

const REPORTS = [
  { risk: "", label: "All Records", desc: "Complete export of every scored record" },
  { risk: "CRITICAL", label: "Critical Only", desc: "Records requiring manual verification" },
  { risk: "WARNING", label: "Warning Only", desc: "Records flagged for supervisor review" },
];

export default function Reports() {
  return (
    <div>
      <Navbar title="Reports" subtitle="Export flagged records for offline review" />
      <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-5">
        {REPORTS.map((r) => (
          <div key={r.label} className="bg-panel border border-border rounded-lg p-6 flex flex-col justify-between">
            <div>
              <h3 className="font-medium">{r.label}</h3>
              <p className="text-muted text-sm mt-2">{r.desc}</p>
            </div>
            <a
              href={exportReport({ surveyId: SURVEY_ID, ...(r.risk ? { risk: r.risk } : {}) })}
              className="mt-5 inline-block text-center bg-accent text-ink font-medium rounded py-2 text-sm hover:brightness-110 transition"
            >
              ⤓ Download CSV
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
