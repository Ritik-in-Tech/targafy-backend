import { Business } from "../../models/business.model.js";
import { Businessusers } from "../../models/businessUsers.model.js";
import { User } from "../../models/user.model.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
export const getNotificationCounter = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    if (!userId) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Invalid token please log in again"));
    }

    const businessId = req.params.businessId;
    if (!businessId) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Business Id not given"));
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(400).json(new ApiResponse(400, {}, "User not found"));
    }

    const business = await Business.findById(businessId);
    if (!business) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Business not found"));
    }

    const businessusers = await Businessusers.findOne({
      userId: userId,
      businessId: businessId,
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

    if (
      "acceptViewCounter" in businessusers &&
      "activityViewCounter" in businessusers &&
      "notificationViewCounter" in businessusers
    ) {
      const totalBusinessNotification =
        businessusers.acceptViewCounter +
        businessusers.activityViewCounter +
        businessusers.notificationViewCounter;
      const response = {
        acceptCounter: businessusers.acceptViewCounter,
        activityCounter: businessusers.activityViewCounter,
        notificationCounter: businessusers.notificationViewCounter,
        totalNotification: totalBusinessNotification,
      };

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            response,
            "Notification counters fetched successfully!"
          )
        );
    } else {
      return res
        .status(200)
        .json(new ApiResponse(200, [], "Not found any counter"));
    }
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json(new ApiResponse(500, { error }, "Internal server error"));
  }
});

export const resetCounter = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    if (!userId) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Invalid token please log in again"));
    }

    const businessId = req.params.businessId;
    if (!businessId) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Business Id not given"));
    }

    const { type } = req.body;
    if (!type) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            {},
            "Please provide any of the type 1) accept 2) activity and 3) notification"
          )
        );
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(400).json(new ApiResponse(400, {}, "User not found"));
    }

    const business = await Business.findById(businessId);
    if (!business) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Business not found"));
    }

    const businessusers = await Businessusers.findOne({
      userId: userId,
      businessId: businessId,
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

    if (type === "accept") {
      businessusers.acceptViewCounter = 0;
    } else if (type === "activity") {
      businessusers.activityViewCounter = 0;
    } else if (type === "notification") {
      businessusers.notificationViewCounter = 0;
    }

    await businessusers.save();

    return res
      .status(200)
      .json(new ApiResponse(200, {}, `${type} counter reset successfully`));
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json(new ApiResponse(500, { error }, "Internal server error"));
  }
});
