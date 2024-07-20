import DailyStats from "../../models/dailystats.model.js";
// import OverallStats from "../../models/overallStats.model.js";
import mongoose from "mongoose";

const parseDate = (dateString) => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    throw new Error("Invalid Date");
  }
  return date;
};

export const getSessionStats = async (req, res) => {
  try {
    const { businessId, date } = req.params;

    const startDate = parseDate(date);
    startDate.setUTCHours(0, 0, 0, 0);

    const endDate = parseDate(date);
    endDate.setUTCHours(23, 59, 59, 999);

    const dailyStats = await DailyStats.findOne({
      businessId: new mongoose.Types.ObjectId(businessId),
      date: {
        $gte: startDate,
        $lt: endDate,
      },
    });

    if (!dailyStats) {
      return res.status(404).json({
        success: false,
        message: "No statistics found for the given date",
      });
    }

    const totalSessionCount = dailyStats.lastSeenHistory
      ? dailyStats.lastSeenHistory.reduce(
          (total, user) => total + (user.lastSeen ? user.lastSeen.length : 0),
          0
        )
      : 0;

    res.json({ success: true, totalSessionCount });
  } catch (error) {
    console.error("Error fetching daily statistics:", error);
    res.status(500).json({ success: false, error: "Internal Server Error " });
  }
};
