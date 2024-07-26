import mongoose from "mongoose";

const lastSeenHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "users",
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

dailyStatsSchema.post("save", async function (doc) {
  await updateOverallStats(doc.date);
});

dailyStatsSchema.post("findOneAndUpdate", async function (doc) {
  console.log("Changes");
  await updateOverallStats(doc.date);
});

async function calculateTotalSessions(date) {
  try {
    const result = await DailyStats.aggregate([
      { $match: { date: date } },
      { $unwind: "$lastSeenHistory" },
      {
        $group: {
          _id: null,
          totalSessions: { $sum: { $size: "$lastSeenHistory.lastSeen" } },
        },
      },
    ]);

    return result.length > 0 ? result[0].totalSessions : 0;
  } catch (error) {
    console.error("Error calculating total sessions:", error);
    return 0;
  }
}

async function updateOverallStats(date) {
  try {
    const totalSessions = await calculateTotalSessions(date);

    await OverallStats.findOneAndUpdate(
      { date: date },
      {
        $set: {
          totalSession: totalSessions,
        },
      },
      { new: true, upsert: true }
    );
  } catch (error) {
    console.error("Error updating overall stats:", error);
  }
}

const DailyStats =
  mongoose.models.DailyStats || mongoose.model("DailyStats", dailyStatsSchema);

export default DailyStats;
