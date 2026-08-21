import mongoose from "mongoose";

const surveyRecordSchema = new mongoose.Schema(
  {
    recordId: { type: String, required: true, unique: true },
    surveyId: { type: String, required: true, index: true },
    district: { type: String, index: true },
    enumeratorId: { type: String, index: true },
    surveyDate: { type: String },
    data: {
      age: Number,
      gender: String,
      education: String,
      employmentStatus: String,
      householdSize: Number,
      weeklyHours: Number,
      monthlyIncome: Number,
    },
  },
  { timestamps: true }
);

export default mongoose.model("SurveyRecord", surveyRecordSchema);
