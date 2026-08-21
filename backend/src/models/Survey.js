import mongoose from "mongoose";

const surveySchema = new mongoose.Schema(
  {
    surveyId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    version: { type: String, default: "1.0" },
    status: { type: String, enum: ["active", "archived"], default: "active" },
  },
  { timestamps: true }
);

export default mongoose.model("Survey", surveySchema);
