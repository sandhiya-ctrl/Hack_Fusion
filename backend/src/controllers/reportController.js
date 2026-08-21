import AnomalyResult from "../models/AnomalyResult.js";

export async function exportCSV(req, res) {
  const { surveyId, risk } = req.query;
  const filter = {};
  if (surveyId) filter.surveyId = surveyId;
  if (risk) filter.risk = risk;

  const results = await AnomalyResult.find(filter).sort({ finalScore: -1 }).lean();

  const header = [
    "recordId", "district", "enumeratorId", "ruleScore", "statisticalScore",
    "mlScore", "finalScore", "risk", "flags", "recommendation",
  ];
  const rows = results.map((r) =>
    [
      r.recordId, r.district, r.enumeratorId, r.ruleScore, r.statisticalScore,
      r.mlScore, r.finalScore, r.risk,
      `"${(r.flags || []).join("; ").replace(/"/g, "'")}"`,
      r.recommendation,
    ].join(",")
  );
  const csv = [header.join(","), ...rows].join("\n");

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="flagged_records_${Date.now()}.csv"`);
  res.send(csv);
}
