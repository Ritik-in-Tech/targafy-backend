import { Business } from "../../models/business.model.js";
import { Businessusers } from "../../models/businessUsers.model.js";
import notificationModel from "../../models/notification.model.js";
import { User } from "../../models/user.model.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import moment from "moment-timezone";

export const getSubordinateUserNotification = asyncHandler(async (req, res) => {
  const businessId = req.params.businessId;
  if (!businessId) {
    return res
      .status(400)
      .json(new ApiResponse(400, {}, "Please provide businessId"));
  }
  const userId = req.user._id;
  if (!userId) {
    return res
      .status(400)
      .json(new ApiResponse(400, {}, "Token expired please log in again!"));
  }
  const business = await Business.findById(businessId);
  if (!business) {
    return res.status(404).json(new ApiResponse(404, {}, "Business not found"));
  }
  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json(new ApiResponse(404, {}, "User not found"));
  }
  const businessusers = await Businessusers.findOne({
    businessId: businessId,
    userId: userId,
  });
  if (!businessusers) {
    return res
      .status(400)
      .json(
        new ApiResponse(
          400,
          {},
          "logged in user is not associated with the business"
        )
      );
  }
  const loggedInUserRole = businessusers.role;

  const notifications = await notificationModel.find({ businessId });

  const filteredNotification = await Promise.all(
    notifications.map(async (notification) => {
      const userDetails = await Businessusers.findOne({
        userId: notification.userId,
        businessId,
      });

      if (!userDetails) {
        return { message: "User details not found" };
      }

      const userRole = userDetails.role;

      if (
        loggedInUserRole === "Admin" ||
        (loggedInUserRole === "MiniAdmin" &&
          (userRole === "MiniAdmin" || userRole === "User")) ||
        (loggedInUserRole === "User" && userRole === "User")
      ) {
        // const createdDateIST = moment(notification.createdDate)
        //   .tz("Asia/Kolkata")
        //   .format("YYYY-MM-DD HH:mm:ss");
        return {
          _id: notification._id,
          userId: notification.userId,
          content: notification.content,
          notificationCategory: notification.notificationCategory,
          createdDate: notification.createdDate,
          businessName: notification.businessName,
          businessId: notification.businessId,
        };
      }

      return { message: "Unauthorized to access this activity" };
    })
  );

  let responseData;
  if (filteredNotification.every((notification) => notification.message)) {
    // If all notifications have a message property, return the message
    responseData = {
      notifications: filteredNotification,
    };
  } else {
    // If some activities have actual data, return the filtered activities
    const validNotification = filteredNotification.filter(
      (notification) => !notification.message
    );
    responseData = {
      notifications: validNotification,
    };
  }

  return res
    .status(200)
    .json(new ApiResponse(200, responseData, "User activities"));
});
