import DailyStats from "../../models/dailystats.model.js";
import mongoose from "mongoose";
import moment from "moment-timezone"; // Import moment-timezone

const timeZone = "Asia/Kolkata";

// Parse and validate date in the local time zone
const parseDateInLocalTime = (dateString) => {
  const date = moment.tz(dateString, timeZone);
  if (!date.isValid()) {
    throw new Error("Invalid Date");
  }
  return date;
};

const getDailyStatisticsForAdmin = async (req, res) => {
  try {
    const { businessId, date } = req.params;

    // Parse and set start and end of the day in local time zone
    const startDate = parseDateInLocalTime(date).startOf("day").toDate();
    // console.log(startDate);
    const endDate = parseDateInLocalTime(date).endOf("day").toDate();

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

    res.json(dailyStats);
  } catch (error) {
    console.error("Error fetching daily statistics:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

const getMonthlyStatisticsForAdmin = async (req, res) => {
  try {
    const { businessId, month, year } = req.params;

    const monthInt = parseInt(month, 10);
    const yearInt = parseInt(year, 10);

    if (isNaN(monthInt) || isNaN(yearInt) || monthInt < 1 || monthInt > 12) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid month or year provided" });
    }

    // Calculate start and end dates for the given month and year in local time zone
    const startDate = moment
      .tz(`${yearInt}-${monthInt}-01`, timeZone)
      .startOf("month")
      .toDate();
    const endDate = moment
      .tz(`${yearInt}-${monthInt}-01`, timeZone)
      .endOf("month")
      .toDate();

    const stats = await DailyStats.aggregate([
      {
        $match: {
          businessId: new mongoose.Types.ObjectId(businessId),
          date: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: {
            month: { $month: "$date" },
            year: { $year: "$date" },
          },
          registeredUsers: { $sum: "$registeredUsers" },
          feedbackGiven: { $sum: "$feedbackGiven" },
          messagesSent: { $sum: "$messagesSent" },
          activeUsers: { $sum: "$activeUsers" },
          dataAdd: { $sum: "$dataAdd" },
          avg_RegisteredUsers: { $avg: "$avg_RegisteredUsers" },
          avg_FeedbackGiven: { $avg: "$avg_FeedbackGiven" },
          avg_MessagesSent: { $avg: "$avg_MessagesSent" },
          avg_ActiveUsers: { $avg: "$avg_ActiveUsers" },
          avg_DataAdd: { $avg: "$avg_DataAdd" },
        },
      },
    ]);

    if (stats.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No statistics found for the given month and year",
      });
    }

    const monthlyStats = stats[0];

    // Calculate total session for the given month
    const totalSessionResult = await DailyStats.aggregate([
      {
        $match: {
          businessId: new mongoose.Types.ObjectId(businessId),
          date: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $project: {
          totalSession: {
            $sum: {
              $map: {
                input: {
                  $ifNull: ["$lastSeenHistory", []],
                },
                as: "history",
                in: {
                  $size: {
                    $ifNull: ["$$history.lastSeen", []],
                  },
                },
              },
            },
          },
        },
      },
    ]);

    monthlyStats.totalSession =
      totalSessionResult.length > 0 ? totalSessionResult[0].totalSession : 0;

    res.json(monthlyStats);
  } catch (error) {
    console.error("Error fetching monthly statistics:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

export { getDailyStatisticsForAdmin, getMonthlyStatisticsForAdmin };
