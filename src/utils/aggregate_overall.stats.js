import { Businessusers } from "../models/businessUsers.model.js";
import OverallStats from "../models/overall.stats.model.js";
import { Usersratings } from "../models/rating.model.js";
import NotificationModel from "../models/notification.model.js";
import { DataAdd } from "../models/dataadd.model.js";
import { getStartOfPreviousDay } from "./aggregate_daily.stats.js";
import { User } from "../models/user.model.js";

export const aggregateOverallDailyStats = async () => {
  try {
    const previousDayStart = getStartOfPreviousDay();
    const previousDayEnd = new Date(previousDayStart);
    previousDayEnd.setUTCHours(23, 59, 59, 999);

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
        createdDate: { $gte: previousDayStart, $lt: previousDayEnd },
      });
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
      const totalSessionResult = await User.aggregate([
        {
          $unwind: "$lastSeenHistory",
        },
        {
          $unwind: "$lastSeenHistory.lastSeen",
        },
        {
          $match: {
            "lastSeenHistory.lastSeen": {
              $gte: previousDayStart,
              $lt: previousDayEnd,
            },
          },
        },
        {
          $group: {
            _id: null,
            totalSessions: { $sum: 1 },
          },
        },
      ]);

      const totalSession =
        totalSessionResult.length > 0 ? totalSessionResult[0].totalSessions : 0;

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
