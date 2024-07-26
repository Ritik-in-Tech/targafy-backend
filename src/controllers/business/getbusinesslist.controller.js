import { Businessusers } from "../../models/businessUsers.model.js";
import NotificationModel from "../../models/notification.model.js";
import { Usersratings } from "../../models/rating.model.js";
import DailyStats from "../../models/dailystats.model.js";
import { Business } from "../../models/business.model.js";
import mongoose from "mongoose";

const get24HoursAgo = () => {
  const now = new Date();
  now.setHours(now.getHours() - 24);
  return now;
};

const getInactiveUsers = async (businessId) => {
  const activeSince = get24HoursAgo();
  const activeUsers = await Businessusers.find(
    {
      businessId: new mongoose.Types.ObjectId(businessId),
      lastSeen: { $gte: activeSince },
    },
    " userId"
  );

  const totalUsers = await Businessusers.find({ businessId }, " userId");

  const inactiveUsers = totalUsers.filter(
    (user) =>
      !activeUsers.some((activeUser) => activeUser.userId.equals(user.userId))
  );

  return inactiveUsers.length;
};

export const getBusinessList = async (req, res) => {
  try {
    const businesses = await Business.find(
      {},
      "_id name logo businessCode createdDate"
    );

    let totalNotificationCount = 0;
    let totalUserCount = 0;
    let totalFeedbackCount = 0;
    let totalInactiveUserCount = 0;

    const businessListPromises = businesses.map(async (business) => {
      const businessId = business._id;

      const now = new Date();
      // const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const last48Hours = new Date(now.getTime() - 48 * 60 * 60 * 1000);

      const [
        notificationCount,
        totalUser,
        lastSeenData,
        feedbackCount,
        inactiveUserCount,
      ] = await Promise.all([
        NotificationModel.countDocuments({ businessId }),
        Businessusers.countDocuments({ businessId }),
        Businessusers.findOne({ businessId }, "lastSeen").sort({
          lastSeen: -1,
        }),
        Usersratings.countDocuments({ businessId }),
        getInactiveUsers(businessId),
      ]);

      const stats = await DailyStats.find({
        businessId,
        date: { $gte: last48Hours },
      });

      // update total counts
      totalNotificationCount += notificationCount;
      totalUserCount += totalUser;
      totalFeedbackCount += feedbackCount;
      totalInactiveUserCount += inactiveUserCount;

      const totalSessions = stats.length > 0 ? stats[0].totalSession || 0 : 0;

      return {
        _id: business._id,
        id: business._id,
        name: business.name,
        logo: business.logo,
        totalSessions,
        businessCode: business.businessCode,
        createdDate: business.createdDate,
        notificationCount,
        totalUser,
        feedbackCount,
        inactiveUserCount,
        lastSeen: lastSeenData ? lastSeenData.lastSeen : null,
      };
    });

    const businessList = await Promise.all(businessListPromises);

    // Sort by totalSessions if needed
    businessList.sort((a, b) => b.totalSessions - a.totalSessions);

    res.status(200).json({
      success: true,
      totals: {
        totalBusinesses: businesses.length,
        totalNotificationCount,
        totalUserCount,
        totalFeedbackCount,
        totalInactiveUserCount,
      },
      data: businessList,
    });
  } catch (error) {
    console.error("Error fetching business list:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};
