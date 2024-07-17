import DailyStats from "../../models/dailystats.model.js";
import mongoose from "mongoose";

const parseDate = (dateString) => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    throw new Error("Invalid Date");
  }
  return date;
};

export const getCombinedMonthlyStats = async (req, res) => {
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
    startDate.setMonth(startDate.getMonth() - 11);
    startDate.setDate(1);
    startDate.setUTCHours(0, 0, 0, 0);

    const monthlyStats = await DailyStats.aggregate([
      {
        $match: {
          businessId: new mongoose.Types.ObjectId(businessId),
          date: {
            $gte: startDate,
            $lt: endDate,
          },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$date" },
            month: { $month: "$date" },
          },
          registeredUsers: { $sum: "$registeredUsers" },
          activeUsers: { $sum: "$activeUsers" },
          feedbackGiven: { $sum: "$feedbackGiven" },
          messagesSent: { $sum: "$messagesSent" },
          sessionCount: { $sum: "$sessionCount" },
          dataAdd: { $sum: "$dataAdd" },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 },
      },
    ]);

    // Prepare the response structure
    const response = {
      dates: [],
      registeredUsers: [],
      activeUsers: [],
      feedbackGiven: [],
      messagesSent: [],
      totalSession: [],
      totalDataAdd: [],
    };

    // Generate all 12 months
    for (let i = 0; i < 12; i++) {
      const currentDate = new Date(endDate);
      currentDate.setMonth(currentDate.getMonth() - i);
      const monthKey = `${currentDate.getFullYear()}-${String(
        currentDate.getMonth() + 1
      ).padStart(2, "0")}`;
      response.dates.unshift(monthKey);
    }

    // Fill in the data, using 0 for missing months
    response.dates.forEach((monthKey) => {
      const stat = monthlyStats.find(
        (s) =>
          `${s._id.year}-${String(s._id.month).padStart(2, "0")}` === monthKey
      );

      response.registeredUsers.push(stat ? stat.registeredUsers : 0);
      response.activeUsers.push(stat ? stat.activeUsers : 0);
      response.feedbackGiven.push(stat ? stat.feedbackGiven : 0);
      response.messagesSent.push(stat ? stat.messagesSent : 0);
      response.totalSession.push(stat ? stat.sessionCount : 0);
      response.totalDataAdd.push(stat ? stat.dataAdd : 0);
    });

    res.json({ success: true, data: response });
  } catch (error) {
    console.error("Error fetching monthly statistics:", error);
    if (error.message === "Invalid Date") {
      return res
        .status(400)
        .json({ success: false, error: "Invalid Date Format" });
    }
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};
