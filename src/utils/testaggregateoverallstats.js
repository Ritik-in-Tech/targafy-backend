import { Businessusers } from "../models/businessUsers.model.js";
import DailyStats from "../models/dailystats.model.js";
import { DataAdd } from "../models/dataadd.model.js";
import NotificationModel from "../models/notification.model.js";
import OverallStats from "../models/overall.stats.model.js";
import { Usersratings } from "../models/rating.model.js";

export const testAggregateOverallStats = async (previousDayStart) => {
  try {
    // const previousDayStart = getStartOfPreviousDay();
    const previousDayEnd = new Date(previousDayStart);
    previousDayEnd.setUTCHours(23, 59, 59, 999);
    const existingStats = await OverallStats.findOne({
      date: previousDayStart,
    });

    if (!existingStats) {
      console.log("Existing stats not found");
      const registeredUsers = await Businessusers.countDocuments({
        registrationDate: { $gte: previousDayStart, $lt: previousDayEnd },
      });
      console.log("The registered users count is:", registeredUsers);
      const feedbackGiven = await Usersratings.countDocuments({
        createdDate: { $gte: previousDayStart, $lt: previousDayEnd },
      });
      console.log("The feedback count is:", feedbackGiven);
      const activeUsers = await Businessusers.countDocuments({
        lastSeen: { $gte: previousDayStart, $lt: previousDayEnd },
      });
      console.log("The active users count is:", activeUsers);
      const messagesSent = await NotificationModel.countDocuments({
        createdDate: { $gte: previousDayStart, $lt: previousDayEnd },
      });
      console.log("The messages sent count is:", messagesSent);
      const dataAddCount = await DataAdd.aggregate([
        {
          $addFields: {
            matchingDates: {
              $filter: {
                input: "$data",
                as: "dataItem",
                cond: {
                  $and: [
                    { $gte: ["$$dataItem.createdDate", previousDayStart] },
                    { $lt: ["$$dataItem.createdDate", previousDayEnd] },
                  ],
                },
              },
            },
          },
        },
        {
          $match: {
            "matchingDates.0": { $exists: true },
          },
        },
        {
          $count: "count",
        },
      ]);
      const dataAdd = dataAddCount.length > 0 ? dataAddCount[0].count : 0;
      console.log("The data add count is:", dataAdd);
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
      console.log("The count of the total session is:", totalSession);

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
