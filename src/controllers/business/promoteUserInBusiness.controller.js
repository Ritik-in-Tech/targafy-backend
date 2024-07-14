import mongoose from "mongoose";
import { Businessusers } from "../../models/businessUsers.model.js";

import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { Business } from "../../models/business.model.js";
import { emitNewNotificationEvent } from "../../sockets/notification_socket.js";
import {
  getCurrentIndianTime,
  getCurrentUTCTime,
} from "../../utils/helpers/time.helper.js";

const promoteUser = asyncHandler(async (req, res, next) => {
  const { role, userIdToPromote } = req.body;
  const businessId = req?.params?.businessId;

  if (!role || !userIdToPromote || !businessId) {
    return res
      .status(400)
      .json(
        new ApiResponse(
          400,
          {},
          "Provide role , userIdToPromote and businessId"
        )
      );
  }

  const business = await Business.findById(businessId);
  if (!business) {
    return res.status(400).json(new ApiResponse(400, {}, "Business not found"));
  }

  if (!userIdToPromote || !role || !["User", "MiniAdmin"].includes(role)) {
    return res
      .status(400)
      .json(new ApiResponse(400, {}, "Invalid user ID or role"));
  }

  try {
    const userToPromote = await Businessusers.findOne({
      businessId: new mongoose.Types.ObjectId(businessId),
      userId: userIdToPromote,
      userType: "Insider",
    });

    if (!userToPromote) {
      return res
        .status(404)
        .json(
          new ApiResponse(404, {}, "User not found in business as insider!!")
        );
    }

    if (userToPromote.role == role) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            {},
            "You have already the same role that you have provided"
          )
        );
    }

    if (userToPromote.userId.equals(req.user._id)) {
      return res
        .status(400)
        .json(
          new ApiResponse(400, {}, "Admin or miniadmin cannot self-promote")
        );
    }

    const result = await Businessusers.updateOne(
      {
        businessId: new mongoose.Types.ObjectId(businessId),
        userId: userIdToPromote,
        userType: "Insider",
      },
      { $set: { role: role } }
    );

    if (result.modifiedCount == 0) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            {},
            "Business not found or user not associated with business"
          )
        );
    }

    const emitData = {
      content: `Your role in business ${business.name}is changed now your role is ${role}`,
      notificationCategory: "business",
      createdDate: getCurrentIndianTime(),
      businessName: business.name,
      businessId: businessId,
    };

    emitNewNotificationEvent(userIdToPromote, emitData);

    return res
      .status(200)
      .json(
        new ApiResponse(200, {}, `User role updated to ${role} successfully`)
      );
  } catch (error) {
    console.error("Error promoting/demoting user:", error);

    return res
      .status(500)
      .json(
        new ApiResponse(500, {}, "An error occurred while updating user role")
      );
  }
});

const demoteUser = asyncHandler(async (req, res, next) => {
  const { userIdToDemote } = req.body;
  const businessId = req?.params?.businessId;
  const loggedInUserId = req.user._id;

  if (!userIdToDemote || !businessId) {
    return res
      .status(400)
      .json(new ApiResponse(400, {}, "Provide userIdToDemote and businessId"));
  }

  const business = await Business.findById(businessId);
  if (!business) {
    return res.status(400).json(new ApiResponse(400, {}, "Business not found"));
  }

  const loggedInUserDetails = await Businessusers.findOne({
    userId: loggedInUserId,
    businessId: businessId,
  });

  if (!loggedInUserDetails) {
    return res
      .status(400)
      .json(
        new ApiResponse(
          400,
          {},
          "Logged in user is not associated with the business"
        )
      );
  }

  if (loggedInUserDetails.role !== "Admin") {
    return res
      .status(400)
      .json(
        new ApiResponse(400, {}, "Only admin allowed to perform this operation")
      );
  }
  try {
    const loggedInUser = await Businessusers.findOne({
      businessId: new mongoose.Types.ObjectId(businessId),
      userId: loggedInUserId,
      userType: "Insider",
    });

    if (!loggedInUser || loggedInUser.role !== "Admin") {
      return res
        .status(403)
        .json(new ApiResponse(403, {}, "Only admins can demote users"));
    }

    const userToDemote = await Businessusers.findOne({
      businessId: new mongoose.Types.ObjectId(businessId),
      userId: userIdToDemote,
      userType: "Insider",
    });

    if (!userToDemote) {
      return res
        .status(404)
        .json(
          new ApiResponse(404, {}, "User not found in business as insider!!")
        );
    }

    if (userToDemote.role === "Admin") {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Cannot demote an admin user"));
    }

    if (userToDemote.role === "User") {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "User already has the lowest role"));
    }

    const result = await Businessusers.updateOne(
      {
        businessId: new mongoose.Types.ObjectId(businessId),
        userId: userIdToDemote,
        userType: "Insider",
      },
      { $set: { role: "User" } }
    );

    if (result.modifiedCount === 0) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            {},
            "Business not found or user not associated with business"
          )
        );
    }

    const emitData = {
      content: `Your role in business ${business.name} has been demoted to User`,
      notificationCategory: "business",
      createdDate: getCurrentIndianTime(),
      businessName: business.name,
      businessId: businessId,
    };
    emitNewNotificationEvent(userIdToDemote, emitData);

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "User role demoted to User successfully"));
  } catch (error) {
    console.error("Error demoting user:", error);
    return res
      .status(500)
      .json(
        new ApiResponse(500, {}, "An error occurred while demoting user role")
      );
  }
});

export { promoteUser, demoteUser };
