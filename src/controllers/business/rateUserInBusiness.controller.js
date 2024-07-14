import mongoose from "mongoose";
const { startSession } = mongoose;

import { Businessusers } from "../../models/businessUsers.model.js";
import { Usersratings } from "../../models/rating.model.js";

import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

import {
  getCurrentIndianTime,
  getCurrentUTCTime,
} from "../../utils/helpers/time.helper.js";
import { sendNotification } from "../notification.controller.js";
import { User } from "../../models/user.model.js";
import { Business } from "../../models/business.model.js";
import { emitNewNotificationEvent } from "../../sockets/notification_socket.js";

const rateUserInBusiness = asyncHandler(async (req, res, next) => {
  try {
    const userId = req?.params?.userId;
    const businessId = req?.params?.businessId;
    const userName = req?.body?.userName;
    let isAnonymous = req.query.isAnonymous;
    let isFeedback = req.query.isFeedback;
    const { rating, message } = req.body;
    const givenByUserId = req?.user?._id;

    const user1 = await User.findById(userId);
    if (!user1) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "User does not exist"));
    }

    let givenBy;
    if (isAnonymous == "true") {
      isAnonymous = true;
      givenBy = {
        name: "Unknown",
        id: givenByUserId,
      };
    } else {
      isAnonymous = false;
      givenBy = {
        name: userName,
        id: givenByUserId,
      };
    }

    // console.log("Given By: ", givenBy);

    // Validate the essential inputs
    if (
      !rating ||
      !message ||
      !userId ||
      !businessId ||
      isNaN(parseFloat(rating)) ||
      !isFinite(rating)
    ) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Invalid or incomplete data provided"));
    }

    // Check rating bounds
    if (rating > 5) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Provide valid rating!!"));
    }

    const newRating = {
      businessId: businessId,
      userId: userId,
      rating: rating,
      message: message,
      givenBy: givenBy,
      givenTo: user1.name,
      createdDate: getCurrentUTCTime(),
    };
    // console.log("New Rating: ", newRating);

    const business = await Business.findById(businessId);
    if (!business) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Business not found"));
    }

    const user = await Businessusers.findOne({
      businessId: businessId,
      userId: userId,
    });

    if (!user) {
      return res
        .status(404)
        .json(new ApiResponse(404, {}, "User not present in business"));
    }

    await Usersratings.create(newRating);

    let newTotalRating = 0;

    if (user.totalRatingsCount <= 0) {
      newTotalRating = rating;
    } else {
      newTotalRating =
        (user?.totalRating * user?.totalRatingsCount + parseFloat(rating)) /
        (user?.totalRatingsCount + 1);
    }

    const result = await Businessusers.updateOne(
      { businessId: businessId, userId: userId },
      {
        $set: {
          totalRating: newTotalRating,
        },
        $inc: {
          totalRatingsCount: 1,
        },
      }
    );

    await Businessusers.updateMany(
      { businessId: businessId },
      {
        $inc: {
          feedbackViewCounter: 1,
        },
      }
    );

    const data = {
      newTotalRating: newTotalRating,
      newRating: newRating,
    };

    if (result.modifiedCount <= 0) {
      return res
        .status(401)
        .json(new ApiResponse(401, {}, "Unable to rate user!!"));
    }

    const emitData = {
      content: `You received a new ${
        isFeedback ? "feedback" : "rating"
      }! Check it out.`,
      notificationCategory: "rating",
      createdDate: getCurrentIndianTime(),
      businessName: business.name,
      businessId: businessId,
    };

    emitNewNotificationEvent(userId, emitData);

    return res
      .status(200)
      .json(new ApiResponse(200, data, "Rate user successfully"));
  } catch (e) {
    console.log("This is error : ", e);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, "Internal server error"));
  }
});

export { rateUserInBusiness };
