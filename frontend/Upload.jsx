import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import { uploadSurvey, runValidation } from "../services/api.js";

export default function Upload() {
  const [file, setFile] = useState(null);
  const [surveyId, setSurveyId] = useState("PLFS_2026");
  const [status, setStatus] = useState(null); // null | uploading | uploaded | validating | done | error
  const [uploadResult, setUploadResult] = useState(null);
  const [validationSummary, setValidationSummary] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();

  const handleUpload = async () => {
    if (!file) return;
    setStatus("uploading");
    setErrorMsg("");
    try {
      const { data } = await uploadSurvey(file, surveyId, "PLFS 2026");
      setUploadResult(data);
      setStatus("uploaded");
    } catch (err) {
      setErrorMsg(err.response?.data?.error || "Upload failed. Is the backend running?");
      setStatus("error");
    }
  };

  const handleRunValidation = async () => {
    setStatus("validating");
    setErrorMsg("");
    try {
      const { data } = await runValidation(surveyId);
      setValidationSummary(data.summary);
      setStatus("done");
    } catch (err) {
      setErrorMsg(err.response?.data?.error || "Validation run failed. Is the ML service running?");
      setStatus("error");
    }
  };

  return (
    <div>
      <Navbar title="Upload Survey Data" subtitle="Batch ingestion of PLFS CAPI export" />
      <div className="p-8 max-w-2xl space-y-6">
        <div className="bg-panel border border-border rounded-lg p-6 space-y-4">
          <div>
            <label className="text-xs text-muted uppercase tracking-wider">Survey ID</label>
            <input
              value={surveyId}
              onChange={(e) => setSurveyId(e.target.value)}
              className="mt-1 w-full bg-panel2 border border-border rounded px-3 py-2 text-sm outline-none focus:border-accent"
            />
          </div>

          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
            <input
              type="file"
              accept=".csv"
              id="file-input"
              className="hidden"
              onChange={(e) => setFile(e.target.files[0])}
            />
            <label htmlFor="file-input" className="cursor-pointer">
              <div className="text-3xl mb-2">⇧</div>
              <div className="text-sm">{file ? file.name : "Drag & drop or click to select a CSV file"}</div>
              <div className="text-xs text-muted mt-1">
                Expected columns: recordId, district, enumeratorId, surveyDate, age, gender, education,
                employmentStatus, householdSize, weeklyHours, monthlyIncome
              </div>
            </label>
          </div>

          <button
            onClick={handleUpload}
            disabled={!file || status === "uploading"}
            className="w-full bg-accent text-ink font-medium rounded py-2.5 text-sm disabled:opacity-40 hover:brightness-110 transition"
          >
            {status === "uploading" ? "Uploading…" : "Upload to MongoDB"}
          </button>

          {errorMsg && <div className="text-critical text-sm">{errorMsg}</div>}
        </div>

        {uploadResult && (
          <div className="bg-panel border border-border rounded-lg p-6 space-y-3">
            <h3 className="text-sm font-medium text-normal">✓ Upload successful</h3>
            <div className="text-sm text-muted">
              {uploadResult.recordsIngested} records ingested into survey <span className="text-white">{uploadResult.surveyId}</span>
            </div>
            <button
              onClick={handleRunValidation}
              disabled={status === "validating"}
              className="w-full bg-normal text-ink font-medium rounded py-2.5 text-sm disabled:opacity-40 hover:brightness-110 transition"
            >
              {status === "validating" ? "Running rule + statistical + ML validation…" : "Run Intelligent Validation"}
            </button>
          </div>
        )}

        {validationSummary && (
          <div className="bg-panel border border-border rounded-lg p-6 space-y-3">
            <h3 className="text-sm font-medium text-normal">✓ Validation complete</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-panel2 rounded p-3">
                <div className="text-muted text-xs">Total Records</div>
                <div className="font-mono text-lg">{validationSummary.totalRecords}</div>
              </div>
              <div className="bg-panel2 rounded p-3">
                <div className="text-muted text-xs">Anomalies</div>
                <div className="font-mono text-lg text-warning">{validationSummary.anomalies}</div>
              </div>
              <div className="bg-panel2 rounded p-3">
                <div className="text-muted text-xs">Critical</div>
                <div className="font-mono text-lg text-critical">{validationSummary.critical}</div>
              </div>
              <div className="bg-panel2 rounded p-3">
                <div className="text-muted text-xs">Anomaly Rate</div>
                <div className="font-mono text-lg text-accent">{validationSummary.anomalyRate}%</div>
              </div>
            </div>
            <button
              onClick={() => navigate("/anomalies")}
              className="w-full bg-accent text-ink font-medium rounded py-2.5 text-sm hover:brightness-110 transition"
            >
              View Anomaly Explorer →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
