import { randomUUID } from "crypto";
import SurveyRecord from "../models/SurveyRecord.js";
import AnomalyResult from "../models/AnomalyResult.js";
import ValidationBatch from "../models/ValidationBatch.js";
import { analyzeRecords } from "../services/mlService.js";

/**
 * Core orchestration flow:
 * MongoDB (raw records) -> Node.js -> Python ML (/ml/analyze) -> MongoDB (results)
 */
export async function runValidation(req, res) {
  try {
    const { surveyId, recordIds } = req.body;
    if (!surveyId) return res.status(400).json({ error: "surveyId is required" });

    const filter = { surveyId };
    if (recordIds?.length) filter.recordId = { $in: recordIds };

    const records = await SurveyRecord.find(filter).lean();
    if (!records.length) {
      return res.status(404).json({ error: "No records found for this survey" });
    }

    const { results, summary } = await analyzeRecords(surveyId, records);

    const batchId = randomUUID();

    const anomalyDocs = results.map((r) => ({ ...r, surveyId, batchId }));
    await AnomalyResult.insertMany(anomalyDocs);

    await ValidationBatch.create({ batchId, surveyId, ...summary });

    res.json({ batchId, summary, resultsCount: results.length });
  } catch (err) {
    console.error("[runValidation]", err.message);
    res.status(500).json({ error: "Validation run failed", details: err.message });
  }
}

export async function getResults(req, res) {
  const { surveyId, risk, enumeratorId, district, batchId, reviewStatus, assignedTo, limit = 100, skip = 0 } = req.query;
  const baseFilter = {};
  if (surveyId) baseFilter.surveyId = surveyId;
  if (risk) baseFilter.risk = risk;
  if (enumeratorId) baseFilter.enumeratorId = enumeratorId;
  if (district) baseFilter.district = district;
  if (batchId) baseFilter.batchId = batchId;
  if (assignedTo) baseFilter.assignedTo = assignedTo;
  const filter = { ...baseFilter };
  // Results created before the review workflow have no reviewStatus field;
  // treat them as NEW so existing validation batches remain reviewable.
  if (reviewStatus === "NEW") {
    filter.$or = [
      { reviewStatus: "NEW" },
      { reviewStatus: { $exists: false } },
      { reviewStatus: null },
    ];
  } else if (reviewStatus) {
    filter.reviewStatus = reviewStatus;
  }

  const results = await AnomalyResult.find(filter)
    .sort({ finalScore: -1 })
    .skip(Number(skip))
    .limit(Number(limit));
  const [total, statusRows] = await Promise.all([
    AnomalyResult.countDocuments(filter),
    AnomalyResult.aggregate([
      { $match: baseFilter },
      { $group: { _id: { $ifNull: ["$reviewStatus", "NEW"] }, count: { $sum: 1 } } },
    ]),
  ]);
  const reviewStatusCounts = Object.fromEntries(statusRows.map((row) => [row._id, row.count]));

  res.json({ total, results, reviewStatusCounts });
}

export async function updateReview(req, res) {
  try {
    const { recordId } = req.params;
    const { reviewStatus, assignedTo, priority, reviewerNotes } = req.body;
    const validStatuses = ["NEW", "UNDER_REVIEW", "CONFIRMED", "FALSE_POSITIVE", "RESOLVED"];
    const validPriorities = ["LOW", "MEDIUM", "HIGH"];

    if (reviewStatus && !validStatuses.includes(reviewStatus)) {
      return res.status(400).json({ error: "Invalid review status" });
    }
    if (priority && !validPriorities.includes(priority)) {
      return res.status(400).json({ error: "Invalid priority" });
    }

    const anomaly = await AnomalyResult.findOne({ recordId }).sort({ createdAt: -1 });
    if (!anomaly) return res.status(404).json({ error: "No validation result for this record" });

    const changes = {};
    if (reviewStatus !== undefined) changes.reviewStatus = reviewStatus;
    if (assignedTo !== undefined) changes.assignedTo = assignedTo;
    if (priority !== undefined) changes.priority = priority;
    if (reviewerNotes !== undefined) changes.reviewerNotes = reviewerNotes;
    if (Object.keys(changes).length === 0) return res.status(400).json({ error: "No review fields provided" });

    Object.assign(anomaly, changes);
    anomaly.reviewedAt = new Date();
    anomaly.reviewHistory.push({
      status: anomaly.reviewStatus,
      assignedTo: anomaly.assignedTo,
      priority: anomaly.priority,
      notes: anomaly.reviewerNotes,
    });
    await anomaly.save();
    res.json({ anomaly });
  } catch (err) {
    console.error("[updateReview]", err.message);
    res.status(500).json({ error: "Could not update review", details: err.message });
  }
}

export async function getRecordDetail(req, res) {
  const { recordId } = req.params;
  const anomaly = await AnomalyResult.findOne({ recordId }).sort({ createdAt: -1 });
  const record = await SurveyRecord.findOne({ recordId });
  if (!anomaly) return res.status(404).json({ error: "No validation result for this record" });
  res.json({ record, anomaly });
}

export async function getLatestBatch(req, res) {
  const { surveyId } = req.query;
  const filter = surveyId ? { surveyId } : {};
  const batch = await ValidationBatch.findOne(filter).sort({ createdAt: -1 });
  if (!batch) return res.status(404).json({ error: "No validation batches yet" });
  res.json(batch);
}
