import { Businessusers } from "../models/businessUsers.model.js";
import { Business } from "../models/business.model.js";
import DailyStats from "../models/dailystats.model.js";
import { Usersratings } from "../models/rating.model.js";
import { DataAdd } from "../models/dataadd.model.js";
import NotificationModel from "../models/notification.model.js";
import mongoose from "mongoose";
import { User } from "../models/user.model.js";

export const getStartOfPreviousDay = () => {
  const yesterday = new Date();
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  yesterday.setUTCHours(0, 0, 0, 0);
  return yesterday;
};

export const getStartOfNDaysAgo = (days) => {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  date.setUTCHours(0, 0, 0, 0);
  return date;
};

const aggregateDailyStats = async () => {
  try {
    // Get the start and end of the previous day in local time
    const previousDayStart = getStartOfPreviousDay();
    const previousDayEnd = new Date(previousDayStart);
    previousDayEnd.setUTCHours(23, 59, 59, 999);

    const businesses = await Business.find().select("_id");

    if (businesses.length === 0) {
      console.log("No business IDs found.");
      return true;
    }

    for (const business of businesses) {
      const businessId = business._id;

      const existingStats = await DailyStats.findOne({
        businessId,
        date: previousDayStart,
      });

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

      const messagesSent = await NotificationModel.countDocuments({
        businessId: businessId,
        createdDate: { $gte: previousDayStart, $lt: previousDayEnd },
      });

      const sevenDaysAgo = getStartOfNDaysAgo(7);

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

      const statsData = {
        businessId,
        date: previousDayStart,
        registeredUsers,
        activeUsers,
        feedbackGiven,
        messagesSent,
        dataAdd,
        avg_RegisteredUsers,
        avg_ActiveUsers,
        avg_FeedbackGiven,
        avg_MessagesSent,
        avg_DataAdd,
      };

      if (existingStats) {
        await DailyStats.updateOne({ _id: existingStats._id }, statsData);
      } else {
        await DailyStats.create(statsData);
      }
    }

    console.log("All business IDs have been processed for the previous day.");
    return true;
  } catch (error) {
    console.error("Error aggregating daily statistics:", error);
    return false;
  }
};

const aggregateTestDailyStats = async (targetDate) => {
  try {
    // Get the start and end of the previous day in local time
    const previousDayStart = new Date(targetDate);
    previousDayStart.setUTCHours(0, 0, 0, 0);
    const previousDayEnd = new Date(previousDayStart);
    previousDayEnd.setUTCHours(23, 59, 59, 999);

    const businesses = await Business.find().select("_id");

    if (businesses.length === 0) {
      console.log("No business IDs found.");
      return true;
    }

    for (const business of businesses) {
      const businessId = business._id;

      const existingStats = await DailyStats.findOne({
        businessId,
        date: previousDayStart,
      });

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

      const messagesSent = await NotificationModel.countDocuments({
        businessId: businessId,
        createdDate: { $gte: previousDayStart, $lt: previousDayEnd },
      });

      const sevenDaysAgo = getStartOfNDaysAgo(7);

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

      const statsData = {
        businessId,
        date: previousDayStart,
        registeredUsers,
        activeUsers,
        feedbackGiven,
        messagesSent,
        dataAdd,
        avg_RegisteredUsers,
        avg_ActiveUsers,
        avg_FeedbackGiven,
        avg_MessagesSent,
        avg_DataAdd,
      };

      if (existingStats) {
        await DailyStats.updateOne({ _id: existingStats._id }, statsData);
      } else {
        await DailyStats.create(statsData);
      }
    }

    console.log("All business IDs have been processed for the previous day.");
    return true;
  } catch (error) {
    console.error("Error aggregating daily statistics:", error);
    return false;
  }
};

export { aggregateDailyStats, aggregateTestDailyStats };
