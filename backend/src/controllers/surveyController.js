import Survey from "../models/Survey.js";
import SurveyRecord from "../models/SurveyRecord.js";
import { parseSurveyCSV } from "../services/csvParser.js";

export async function listSurveys(req, res) {
  const surveys = await Survey.find().sort({ createdAt: -1 });
  res.json(surveys);
}

export async function uploadSurveyData(req, res) {
  try {
    const { surveyId = "PLFS_2026", surveyName = "PLFS 2026" } = req.body;
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    await Survey.findOneAndUpdate(
      { surveyId },
      { surveyId, name: surveyName, status: "active" },
      { upsert: true, new: true }
    );

    const records = parseSurveyCSV(req.file.buffer, surveyId);

    // Upsert so re-uploading the same recordId doesn't duplicate (idempotent ingestion)
    const ops = records.map((r) => ({
      updateOne: { filter: { recordId: r.recordId }, update: r, upsert: true },
    }));
    if (ops.length) await SurveyRecord.bulkWrite(ops);

    res.json({
      message: "Upload successful",
      surveyId,
      recordsIngested: records.length,
      preview: records.slice(0, 5),
    });
  } catch (err) {
    console.error("[uploadSurveyData]", err);
    res.status(500).json({ error: "Failed to process upload", details: err.message });
  }
}

export async function listRecords(req, res) {
  const { surveyId, limit = 100, skip = 0 } = req.query;
  const filter = surveyId ? { surveyId } : {};
  const records = await SurveyRecord.find(filter).skip(Number(skip)).limit(Number(limit));
  const total = await SurveyRecord.countDocuments(filter);
  res.json({ total, records });
}
