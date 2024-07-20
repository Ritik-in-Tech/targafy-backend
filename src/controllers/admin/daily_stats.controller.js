import DailyStats from "../../models/dailystats.model.js";
import mongoose from "mongoose";
import { parseDateInLocalTime } from "../../utils/helpers/parselocaldatetime.js";

export const getDailyStatisticsForAdmin = async (req, res) => {
  try {
    const { businessId, date } = req.params;

    const startDate = parseDateInLocalTime(date).startOf("day").toDate();

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
