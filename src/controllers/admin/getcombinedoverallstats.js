import OverallStats from "../../models/overall.stats.model.js";
import moment from "moment-timezone";

export const getCombinedOverAllStatisticsAdmin = async (req, res) => {
  try {
    const { date } = req.params;

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid Date Format" });
    }

    const endDate = moment.utc(date).endOf("day");
    const startDate = moment.utc(date).subtract(29, "days").startOf("day");

    const dailyStats = await OverallStats.find(
      {
        date: {
          $gte: startDate.toDate(),
          $lte: endDate.toDate(),
        },
      },
      {
        date: 1,
        registeredUsers: 1,
        feedbackGiven: 1,
        messagesSent: 1,
        activeUsers: 1,
        totalSession: 1,
        dataAdd: 1,
      }
    ).sort({ date: 1 });

    // Create a map of existing stats indexed by date string
    const statsMap = new Map(
      dailyStats.map((stat) => [moment(stat.date).format("YYYY-MM-DD"), stat])
    );

    // Structure the response with arrays for each parameter
    const response = {
      dates: [],
      totalUsers: [],
      activeUsers: [],
      totalFeedbacks: [],
      totalMessages: [],
      totalSessions: [],
      totalDataAdded: [],
    };

    // Iterate through all 30 days
    for (
      let m = moment(startDate);
      m.isSameOrBefore(endDate);
      m.add(1, "days")
    ) {
      const dateStr = m.format("YYYY-MM-DD");
      const stat = statsMap.get(dateStr) || {};

      response.dates.push(dateStr);
      response.totalUsers.push(stat.registeredUsers || 0);
      response.activeUsers.push(stat.activeUsers || 0);
      response.totalFeedbacks.push(stat.feedbackGiven || 0);
      response.totalMessages.push(stat.messagesSent || 0);
      response.totalSessions.push(stat.totalSession || 0);
      response.totalDataAdded.push(stat.dataAdd || 0);
    }

    res.json({ success: true, data: response });
  } catch (error) {
    console.error("Error fetching daily statistics:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};
