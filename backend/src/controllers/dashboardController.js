import ValidationBatch from "../models/ValidationBatch.js";
import AnomalyResult from "../models/AnomalyResult.js";
import SurveyRecord from "../models/SurveyRecord.js";

export async function getDashboardStats(req, res) {
  const { surveyId, reviewStatus } = req.query;
  const filter = surveyId ? { surveyId } : {};
  if (reviewStatus === "NEW") filter.$or = [{ reviewStatus: "NEW" }, { reviewStatus: { $exists: false } }, { reviewStatus: null }];
  else if (reviewStatus) filter.reviewStatus = reviewStatus;

  const [riskBreakdown, reviewBreakdown] = await Promise.all([
    AnomalyResult.aggregate([{ $match: filter }, { $group: { _id: "$risk", count: { $sum: 1 } } }]),
    AnomalyResult.aggregate([{ $match: surveyId ? { surveyId } : {} }, { $group: { _id: { $ifNull: ["$reviewStatus", "NEW"] }, count: { $sum: 1 } } }]),
  ]);
  const riskCounts = Object.fromEntries(riskBreakdown.map((row) => [row._id, row.count]));
  const totalRecords = Object.values(riskCounts).reduce((sum, count) => sum + count, 0);
  const anomalies = (riskCounts.WARNING || 0) + (riskCounts.CRITICAL || 0);
  res.json({
    totalRecords,
    anomalies,
    critical: riskCounts.CRITICAL || 0,
    warning: riskCounts.WARNING || 0,
    anomalyRate: totalRecords ? Number(((anomalies / totalRecords) * 100).toFixed(1)) : 0,
    riskBreakdown,
    reviewStatusCounts: Object.fromEntries(reviewBreakdown.map((row) => [row._id, row.count])),
  });
}

export async function getEnumeratorAnalysis(req, res) {
  const { surveyId, batchId } = req.query;
  const filter = batchId ? { batchId } : surveyId ? { surveyId } : {};
  const batch = await ValidationBatch.findOne(filter).sort({ createdAt: -1 });
  res.json(batch?.enumeratorAnalysis || []);
}

export async function getDistrictAnalysis(req, res) {
  const { surveyId } = req.query;
  const filter = surveyId ? { surveyId } : {};
  const latestBatch = await ValidationBatch.findOne(filter).sort({ createdAt: -1 });
  res.json(latestBatch?.districtAnalysis || []);
}
