import { Businessusers } from "../models/businessUsers.model.js";
import { Business } from "../models/business.model.js";
import DailyStats from "../models/dailystats.model.js";
import { Usersratings } from "../models/rating.model.js";
import { DataAdd } from "../models/dataadd.model.js";
import NotificationModel from "../models/notification.model.js";
import moment from "moment-timezone"; // Import moment-timezone

// Define the time zone
const timeZone = "Asia/Kolkata";

const getStartOfPreviousDayInLocalTime = () => {
  const yesterday = moment.tz(timeZone).subtract(1, "days").startOf("day");
  return yesterday.toDate();
};

const getStartOfNDaysAgoInLocalTime = (days) => {
  const date = moment.tz(timeZone).subtract(days, "days").startOf("day");
  return date.toDate();
};

const aggregateDailyStats = async () => {
  try {
    // Get the start and end of the previous day in local time
    const previousDayStart = getStartOfPreviousDayInLocalTime();
    const previousDayEnd = moment(previousDayStart).endOf("day").toDate();

    const businesses = await Business.find().select("_id");

    if (businesses.length === 0) {
      console.log("No business IDs found.");
      return true;
    }

    let allUpdated = true;

    for (const business of businesses) {
      const businessId = business._id;

      const existingStats = await DailyStats.findOne({
        businessId,
        date: previousDayStart,
      });

      if (!existingStats) {
        allUpdated = false;

        const registeredUsers = await Businessusers.countDocuments({
          businessId: businessId,
          registrationDate: { $gte: previousDayStart, $lt: previousDayEnd },
        });

        const activeUsers = await Businessusers.countDocuments({
          businessId: businessId,
          lastSeen: { $gte: previousDayStart, $lt: previousDayEnd },
        });

        const feedbackGiven = await Usersratings.countDocuments({
          businessId: businessId,
          createdDate: { $gte: previousDayStart, $lt: previousDayEnd },
        });

        const dataAddCount = await DataAdd.aggregate([
          {
            $match: {
              businessId: new mongoose.Types.ObjectId(businessId),
            },
          },
          {
            $addFields: {
              lastCreatedDate: {
                $max: "$data.createdDate",
              },
            },
          },
          {
            $match: {
              lastCreatedDate: {
                $gte: previousDayStart,
                $lt: previousDayEnd,
              },
            },
          },
          {
            $count: "count",
          },
        ]);

        const dataAdd = dataAddCount.length > 0 ? dataAddCount[0].count : 0;

        const messagesSent = await NotificationModel.countDocuments({
          businessId: businessId,
          createdDate: { $gte: previousDayStart, $lt: previousDayEnd },
        });

        const sevenDaysAgo = getStartOfNDaysAgoInLocalTime(7);

        const statsOfLast7Days = await DailyStats.aggregate([
          {
            $match: {
              businessId,
              date: { $gte: sevenDaysAgo, $lt: previousDayStart },
            },
          },
          {
            $group: {
              _id: null,
              total_RegisteredUsers: { $sum: "$registeredUsers" },
              total_ActiveUsers: { $sum: "$activeUsers" },
              total_FeedbackGiven: { $sum: "$feedbackGiven" },
              total_MessagesSent: { $sum: "$messagesSent" },
              total_DataAdd: { $sum: "$dataAdd" },
              count: { $sum: 1 },
            },
          },
        ]);

        const avgStats = statsOfLast7Days[0] || {
          total_RegisteredUsers: 0,
          total_ActiveUsers: 0,
          total_FeedbackGiven: 0,
          total_MessagesSent: 0,
          total_DataAdd: 0,
          count: 1,
        };

        const avg_RegisteredUsers =
          avgStats.total_RegisteredUsers / avgStats.count;
        const avg_FeedbackGiven = avgStats.total_FeedbackGiven / avgStats.count;
        const avg_MessagesSent = avgStats.total_MessagesSent / avgStats.count;
        const avg_ActiveUsers = avgStats.total_ActiveUsers / avgStats.count;
        const avg_DataAdd = avgStats.total_DataAdd / avgStats.count;

        await DailyStats.create({
          businessId,
          date: previousDayStart,
          registeredUsers: registeredUsers,
          activeUsers: activeUsers,
          feedbackGiven: feedbackGiven,
          messagesSent: messagesSent,
          dataAdd: dataAdd,
          avg_RegisteredUsers: avg_RegisteredUsers,
          avg_ActiveUsers: avg_ActiveUsers,
          avg_FeedbackGiven: avg_FeedbackGiven,
          avg_MessagesSent: avg_MessagesSent,
          avg_DataAdd: avg_DataAdd,
        });
      }
    }
    if (allUpdated) {
      console.log("All business IDs have been processed for the previous day.");
    } else {
      console.log("Processing incomplete for some business IDs.");
    }
    return allUpdated;
  } catch (error) {
    console.error("Error aggregating daily statistics:", error);
    return false;
  }
};

export { aggregateDailyStats };
