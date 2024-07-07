import mongoose from "mongoose";

const overallStatsSchema = new mongoose.Schema({
  date: { type: Date, unique: true },
  registeredUsers: { type: Number, default: 0 },
  feedbackGiven: { type: Number, default: 0 },
  messagesSent: { type: Number, default: 0 },
  activeUsers: { type: Number, default: 0 },
  totalSession: { type: Number, default: 0 },
  dataAdd: { type: Number, default: 0 },
});

const OverallStats = mongoose.model("OverallStats", overallStatsSchema);

export default OverallStats;
