import mongoose from "mongoose";

const validationBatchSchema = new mongoose.Schema(
  {
    batchId: { type: String, required: true, unique: true },
    surveyId: { type: String, required: true },
    totalRecords: Number,
    anomalies: Number,
    critical: Number,
    warning: Number,
    anomalyRate: Number,
    processingTimeMs: Number,
    enumeratorAnalysis: mongoose.Schema.Types.Mixed,
    districtAnalysis: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

export default mongoose.model("ValidationBatch", validationBatchSchema);
