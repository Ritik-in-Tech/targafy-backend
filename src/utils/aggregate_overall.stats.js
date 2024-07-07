import { Businessusers } from "../models/businessUsers.model.js";
import DailyStats from "../models/dailystats.model.js";
import OverallStats from "../models/overall.stats.model.js";
import { Usersratings } from "../models/rating.model.js";
import NotificationModel from "../models/notification.model.js";
import moment from "moment-timezone";
import { DataAdd } from "../models/dataadd.model.js";
const timeZone = "Asia/Kolkata";

const getStartOfPreviousDayInLocalTime = () => {
  const yesterday = moment.tz(timeZone).subtract(1, "days").startOf("day");
  return yesterday.toDate();
};

export const aggregateOverallDailyStats = async () => {
  try {
    const previousDayStart = getStartOfPreviousDayInLocalTime();
    const previousDayEnd = moment(previousDayStart).endOf("day").toDate();

    const existingStats = await OverallStats.findOne({
      date: previousDayStart,
    });

    if (!existingStats) {
      const registeredUsers = await Businessusers.countDocuments({
        registrationDate: { $gte: previousDayStart, $lt: previousDayEnd },
      });
      const feedbackGiven = await Usersratings.countDocuments({
        createdDate: { $gte: previousDayStart, $lt: previousDayEnd },
      });
      const activeUsers = await Businessusers.countDocuments({
        lastSeen: { $gte: previousDayStart, $lt: previousDayEnd },
      });
      const messagesSent = await NotificationModel.countDocuments({
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
      const overallTotalSession = await DailyStats.aggregate([
        { $match: { date: { $gte: previousDayStart, $lt: previousDayEnd } } },
        {
          $project: {
            totalSession: {
              $reduce: {
                input: "$lastSeenHistory",
                initialValue: 0,
                in: { $add: ["$$value", { $size: "$$this.lastSeen" }] },
              },
            },
          },
        },
        {
          $group: {
            _id: null,
            totalSession: { $sum: "$totalSession" },
          },
        },
      ]);

      let totalSession = 0;
      if (overallTotalSession.length > 0) {
        totalSession = overallTotalSession[0].totalSession;
      }

      await OverallStats.create({
        date: previousDayStart,
        registeredUsers: registeredUsers,
        feedbackGiven: feedbackGiven,
        messagesSent: messagesSent,
        activeUsers: activeUsers,
        totalSession: totalSession,
        dataAdd: dataAdd,
      });

      console.log(
        "Overall statistics for the previous day have been processed."
      );
    } else {
      console.log("Overall statistics for the previous day already exist.");
    }

    return true;
  } catch (error) {
    console.error("Error aggregating overall daily statistics:", error);
    return false;
  }
};
