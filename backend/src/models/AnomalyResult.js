import mongoose from "mongoose";

const anomalyResultSchema = new mongoose.Schema(
  {
    recordId: { type: String, required: true, index: true },
    surveyId: { type: String, required: true, index: true },
    district: String,
    enumeratorId: { type: String, index: true },
    ruleScore: Number,
    statisticalScore: Number,
    mlScore: Number,
    finalScore: { type: Number, index: true },
    risk: { type: String, enum: ["NORMAL", "WARNING", "CRITICAL"], index: true },
    isAnomaly: { type: Boolean, index: true },
    flags: [String],
    statisticalDetails: mongoose.Schema.Types.Mixed,
    recommendation: String,
    batchId: { type: String, index: true },
    reviewStatus: {
      type: String,
      enum: ["NEW", "UNDER_REVIEW", "CONFIRMED", "FALSE_POSITIVE", "RESOLVED"],
      default: "NEW",
      index: true,
    },
    assignedTo: { type: String, trim: true, index: true },
    priority: { type: String, enum: ["LOW", "MEDIUM", "HIGH"], default: "MEDIUM" },
    reviewerNotes: { type: String, trim: true, default: "" },
    reviewedAt: Date,
    reviewHistory: [
      {
        status: { type: String, required: true },
        assignedTo: String,
        priority: String,
        notes: String,
        changedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("AnomalyResult", anomalyResultSchema);
