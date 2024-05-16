import mongoose from "mongoose";
import { Businessusers } from "../../models/businessUsers.model.js";

import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

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

    //   const emitData = {
    //       "content": `Your role in business ${business.name}is changed now your role is ${role}`,
    //       "notificationCategory": "business",
    //       "createdDate": getCurrentUTCTime(),
    //       "businessName": business.name,
    //       "businessId": businessId
    //   };
    //
    //   emitNewNotificationEvent(userIdToPromote, emitData);

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

export { promoteUser };
