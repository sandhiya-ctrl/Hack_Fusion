import mongoose from "mongoose";

export async function connectDB() {
  const uri = process.env.MONGO_URI || "mongodb://localhost:27017/surveyguard";
  try {
    await mongoose.connect(uri);
    console.log(`[db] Connected to MongoDB at ${uri}`);
  } catch (err) {
    console.error("[db] MongoDB connection failed:", err.message);
    process.exit(1);
  }
}
