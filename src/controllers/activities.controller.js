import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { Business } from "../models/business.model.js";
import { Businessusers } from "../models/businessUsers.model.js";
import { Activites } from "../models/activities.model.js";

const getAllActivityBusiness = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    if (!userId) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Invalid token! Please log in again"));
    }

    const businessId = req.params.businessId;
    if (!businessId) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            {},
            "Please provide businessId in request params"
          )
        );
    }

    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            {},
            "User does not exist for the provided user Id"
          )
        );
    }

    const business = await Business.findById(businessId);
    if (!business) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            {},
            "Business not found for the provided business Id"
          )
        );
    }

    const businessUserDetail = await Businessusers.findOne({
      userId: userId,
      businessId: businessId,
    });

    if (!businessUserDetail) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            {},
            "Business does not exist with the provided user Id and business Id"
          )
        );
    }

    // Get all subordinates' IDs
    const allSubordinateIds = businessUserDetail.allSubordinates.map((sub) =>
      sub._id.toString()
    );

    let activities;
    if (allSubordinateIds.length > 0) {
      // Fetch activities for all subordinates
      activities = await Activites.find({
        userId: { $in: allSubordinateIds },
        businessId: businessId,
      }).select("content activityCategory createdDate");
    } else {
      // Fetch activities for the user
      activities = await Activites.find({
        userId: userId,
        businessId: businessId,
      }).select("content activityCategory createdDate");
    }

    return res
      .status(200)
      .json(
        new ApiResponse(200, { activities }, "Activities fetched successfully")
      );
  } catch (error) {
    console.error("Error:", error);
    return res
      .status(500)
      .json(new ApiResponse(500, { error }, "Internal Server Error"));
  }
});

export { getAllActivityBusiness };
