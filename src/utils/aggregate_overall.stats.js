import { Businessusers } from "../models/businessUsers.model.js";
import OverallStats from "../models/overall.stats.model.js";
import { Usersratings } from "../models/rating.model.js";
import NotificationModel from "../models/notification.model.js";
import { DataAdd } from "../models/dataadd.model.js";
import { getStartOfPreviousDay } from "./aggregate_daily.stats.js";
import { User } from "../models/user.model.js";
import DailyStats from "../models/dailystats.model.js";

export const aggregateOverallDailyStats = async () => {
  try {
    const previousDayStart = getStartOfPreviousDay();
    const previousDayEnd = new Date(previousDayStart);
    previousDayEnd.setUTCHours(23, 59, 59, 999);

    const existingStats = await OverallStats.findOne({
      date: previousDayStart,
    });

    // if (!existingStats) {
    const registeredUsers = await Businessusers.aggregate([
      {
        $match: {
          businessId: businessId,
          registrationDate: { $gte: previousDayStart, $lt: previousDayEnd },
        },
      },
      {
        $group: {
          _id: "$userId",
        },
      },
      {
        $count: "uniqueCount",
      },
    ]);

    const activeUsers = await Businessusers.aggregate([
      {
        $match: {
          businessId: businessId,
          lastSeen: { $gte: previousDayStart, $lt: previousDayEnd },
        },
      },
      {
        $group: {
          _id: "$userId",
        },
      },
      {
        $count: "uniqueCount",
      },
    ]);
    const feedbackGiven = await Usersratings.countDocuments({
      createdDate: { $gte: previousDayStart, $lt: previousDayEnd },
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

    await OverallStats.findOneAndUpdate(
      { date: previousDayStart },
      {
        $set: {
          registeredUsers: registeredUsers,
          feedbackGiven: feedbackGiven,
          messagesSent: messagesSent,
          activeUsers: activeUsers,
          totalSession: totalSession,
          dataAdd: dataAdd,
        },
      },
      { new: true, upsert: true }
    );

    console.log("Overall statistics for the previous day have been processed.");
    // } else {
    //   console.log("Overall statistics for the previous day already exist.");
    // }

    return true;
  } catch (error) {
    console.error("Error aggregating overall daily statistics:", error);
    return false;
  }
};

export const aggregateTestOverallDailyStats = async (targetDate) => {
  try {
    const previousDayStart = new Date(targetDate);
    previousDayStart.setUTCHours(0, 0, 0, 0);
    const previousDayEnd = new Date(previousDayStart);
    previousDayEnd.setUTCHours(23, 59, 59, 999);

    const existingStats = await OverallStats.findOne({
      date: previousDayStart,
    });

    if (!existingStats) {
      const registeredUsers = await Businessusers.aggregate([
        {
          $match: {
            businessId: businessId,
            registrationDate: { $gte: previousDayStart, $lt: previousDayEnd },
          },
        },
        {
          $group: {
            _id: "$userId",
          },
        },
        {
          $count: "uniqueCount",
        },
      ]);

      const activeUsers = await Businessusers.aggregate([
        {
          $match: {
            businessId: businessId,
            lastSeen: { $gte: previousDayStart, $lt: previousDayEnd },
          },
        },
        {
          $group: {
            _id: "$userId",
          },
        },
        {
          $count: "uniqueCount",
        },
      ]);
      const feedbackGiven = await Usersratings.countDocuments({
        createdDate: { $gte: previousDayStart, $lt: previousDayEnd },
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
