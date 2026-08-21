import axios from "axios";

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";

const client = axios.create({ baseURL: ML_SERVICE_URL, timeout: 60000 });

/**
 * Sends only the fields the ML service needs (feature contract) - not the
 * raw Mongo documents - keeping Node.js and Python loosely coupled.
 */
export async function analyzeRecords(surveyId, records) {
  const payload = {
    surveyId,
    records: records.map((r) => ({
      recordId: r.recordId,
      district: r.district,
      enumeratorId: r.enumeratorId,
      surveyDate: r.surveyDate,
      age: r.data?.age,
      gender: r.data?.gender,
      education: r.data?.education,
      employmentStatus: r.data?.employmentStatus,
      householdSize: r.data?.householdSize,
      weeklyHours: r.data?.weeklyHours,
      monthlyIncome: r.data?.monthlyIncome,
    })),
  };
  const { data } = await client.post("/ml/analyze", payload);
  return data; // { results: [...], summary: {...} }
}

export async function triggerTrain(contamination = 0.05) {
  const { data } = await client.post("/ml/train", { contamination });
  return data;
}

export async function getModelInfo() {
  const { data } = await client.get("/ml/model-info");
  return data;
}
