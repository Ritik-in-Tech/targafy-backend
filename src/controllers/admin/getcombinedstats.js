import DailyStats from "../../models/dailystats.model.js";
import mongoose from "mongoose";

const parseDate = (dateString) => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    throw new Error("Invalid Date");
  }
  return date;
};
export const getCombinedStats = async (req, res) => {
  try {
    const { businessId, date } = req.params;

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid Date Format" });
    }

    const endDate = parseDate(date);
    if (isNaN(endDate)) {
      throw new Error("Invalid Date");
    }
    endDate.setUTCHours(23, 59, 59, 999);
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 29);
    startDate.setUTCHours(0, 0, 0, 0);

    const weeklyStats = await DailyStats.find(
      {
        businessId: new mongoose.Types.ObjectId(businessId),
        date: {
          $gte: startDate,
          $lt: endDate,
        },
      },
      {
        registeredUsers: 1,
        activeUsers: 1,
        feedbackGiven: 1,
        messagesSent: 1,
        lastSeenHistory: 1,
        dataAdd: 1,
        date: 1,
      }
    ).sort({ date: 1 });

    if (!weeklyStats.length) {
      return res.status(404).json({
        success: false,
        message: "No statistics found for the given date range",
      });
    }

    // Structure the response with arrays for each parameter
    const response = {
      dates: [],
      registeredUsers: [],
      activeUsers: [],
      feedbackGiven: [],
      messagesSent: [],
      totalSession: [],
      totalDataAdd: [],
    };

    weeklyStats.forEach((stat) => {
      response.dates.push(
        stat.date ? stat.date.toISOString().split("T")[0] : "N/A"
      );
      response.activeUsers.push(stat.activeUsers || 0);
      response.registeredUsers.push(stat.registeredUsers || 0);
      response.feedbackGiven.push(stat.feedbackGiven || 0);
      response.messagesSent.push(stat.messagesSent || 0);
      response.totalSession.push(stat.totalSession || 0);
      response.totalDataAdd.push(stat.dataAdd || 0);
    });

    res.json({ success: true, data: response });
  } catch (error) {
    console.error("Error fetching weekly statistics:", error);
    if (error.message === "Invalid Date") {
      return res
        .status(400)
        .json({ success: false, error: "Invalid Date Format" });
    }
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};
