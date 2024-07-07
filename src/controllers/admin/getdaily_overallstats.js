import OverallStats from "../../models/overall.stats.model.js";
import moment from "moment-timezone";

export const getDailyOverAllStatisticsAdmin = async (req, res) => {
  try {
    const { date } = req.params;

    const startDate = moment.utc(date).startOf("day").toDate();

    const endDate = moment.utc(date).endOf("day").toDate();

    const dailyStats = await OverallStats.findOne({
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
