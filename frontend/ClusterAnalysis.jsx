import { useEffect, useState } from "react";
import Navbar from "../components/Navbar.jsx";
import { getEnumeratorAnalysis, getDistrictAnalysis } from "../services/api.js";

const SURVEY_ID = "PLFS_2026";

export default function ClusterAnalysis() {
  const [enumerators, setEnumerators] = useState([]);
  const [districts, setDistricts] = useState([]);

  useEffect(() => {
    getEnumeratorAnalysis(SURVEY_ID).then(({ data }) => setEnumerators(data));
    getDistrictAnalysis(SURVEY_ID).then(({ data }) => setDistricts(data));
  }, []);

  return (
    <div>
      <Navbar title="Cluster Analysis" subtitle="Enumerator bias & district-level aggregate anomalies" />
      <div className="p-8 space-y-8">
        <section>
          <h3 className="text-sm font-medium text-muted uppercase tracking-wider mb-3">Enumerator Analysis</h3>
          <p className="text-xs text-muted mb-4">
            Anomaly rate per enumerator vs. regional average. A rate significantly higher than the
            regional average may indicate enumerator bias rather than genuine anomalies.
          </p>
          <div className="overflow-x-auto border border-border rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-panel2 text-muted text-xs uppercase tracking-wider">
                <tr>
                  <th className="text-left px-4 py-3">Enumerator</th>
                  <th className="text-left px-4 py-3">Records</th>
                  <th className="text-left px-4 py-3">Anomalies</th>
                  <th className="text-left px-4 py-3">Anomaly Rate</th>
                  <th className="text-left px-4 py-3">Regional Avg</th>
                  <th className="text-left px-4 py-3">Flag</th>
                </tr>
              </thead>
              <tbody>
                {[...enumerators]
                  .sort((a, b) => b.anomalyRate - a.anomalyRate)
                  .map((e) => (
                    <tr key={e.enumeratorId} className="border-t border-border hover:bg-panel2/50">
                      <td className="px-4 py-3 font-mono">{e.enumeratorId}</td>
                      <td className="px-4 py-3">{e.totalRecords}</td>
                      <td className="px-4 py-3">{e.anomalies}</td>
                      <td className="px-4 py-3 font-mono">{e.anomalyRate}%</td>
                      <td className="px-4 py-3 text-muted">{e.regionalAverage}%</td>
                      <td className="px-4 py-3">
                        {e.deviationFlag ? (
                          <span className="text-critical">🔴 Significant deviation</span>
                        ) : (
                          <span className="text-normal">🟢 Normal</span>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h3 className="text-sm font-medium text-muted uppercase tracking-wider mb-3">District-Level Aggregate Analysis</h3>
          <div className="overflow-x-auto border border-border rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-panel2 text-muted text-xs uppercase tracking-wider">
                <tr>
                  <th className="text-left px-4 py-3">District</th>
                  <th className="text-left px-4 py-3">Records</th>
                  <th className="text-left px-4 py-3">Anomalies</th>
                  <th className="text-left px-4 py-3">Anomaly Rate</th>
                </tr>
              </thead>
              <tbody>
                {[...districts]
                  .sort((a, b) => b.anomalyRate - a.anomalyRate)
                  .map((d) => (
                    <tr key={d.district} className="border-t border-border hover:bg-panel2/50">
                      <td className="px-4 py-3">{d.district}</td>
                      <td className="px-4 py-3">{d.totalRecords}</td>
                      <td className="px-4 py-3">{d.anomalies}</td>
                      <td className="px-4 py-3 font-mono">
                        {d.anomalyRate}% {d.anomalyRate > 10 && <span className="ml-1">🔴</span>}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
