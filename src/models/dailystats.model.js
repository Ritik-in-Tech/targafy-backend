import mongoose from "mongoose";

const lastSeenHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Users",
    },
    lastSeen: {
      type: [Date],
      default: [],
    },
  },
  { _id: false }
);
const dailyStatsSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "businesses",
    },
    date: {
      type: Date,
      required: true,
    },
    registeredUsers: {
      type: Number,
      default: 0,
    },
    activeUsers: {
      type: Number,
      default: 0,
    },
    feedbackGiven: {
      type: Number,
      default: 0,
    },
    messagesSent: {
      type: Number,
      default: 0,
    },
    sessionCount: {
      type: Number,
      default: 0,
    },
    dataAdd: {
      type: Number,
      default: 0,
    },
    avg_RegisteredUsers: {
      type: Number,
      default: 0,
    },
    avg_FeedbackGiven: {
      type: Number,
      default: 0,
    },
    avg_MessagesSent: {
      type: Number,
      default: 0,
    },
    avg_ActiveUsers: {
      type: Number,
      default: 0,
    },
    avg_DataAdd: {
      type: Number,
      default: 0,
    },
    lastSeenHistory: {
      type: [lastSeenHistorySchema],
      default: [],
    },
  },
  { timestamps: true }
);

dailyStatsSchema.virtual("totalSession").get(function () {
  return this.lastSeenHistory.reduce(
    (total, user) => total + user.lastSeen.length,
    0
  );
});

// Ensure virtual fields are included in JSON output
dailyStatsSchema.set("toJSON", {
  virtuals: true,
  transform: function (doc, ret) {
    delete ret.lastSeenHistory;
    return ret;
  },
});
dailyStatsSchema.set("toObject", { virtuals: true });

const DailyStats =
  mongoose.models.DailyStats || mongoose.model("DailyStats", dailyStatsSchema);

export default DailyStats;
