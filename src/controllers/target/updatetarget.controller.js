import { asyncHandler } from "../../utils/asyncHandler.js";
import { Target } from "../../models/target.model.js";
import { Business } from "../../models/business.model.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { User } from "../../models/user.model.js";
import { Businessusers } from "../../models/businessUsers.model.js";
import { Activites } from "../../models/activities.model.js";
import mongoose from "mongoose";

const updateUserTarget = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { userId, newTargetValue, comment, monthIndex } = req.body;
    if (!userId || !monthIndex) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Please provide required fields"));
    }

    const { paramName, businessId } = req.params;
    if (!paramName || !businessId) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            {},
            "Please provide businessId and param Name in params"
          )
        );
    }

    const loggedInuserId = req.user._id;
    if (!loggedInuserId) {
      return res
        .status(400)
        .json(
          new ApiResponse(400, {}, "Session is invalid! Please log in again")
        );
    }

    const loggedInUser = await User.findById(loggedInuserId).session(session);
    if (!loggedInUser) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Admin or MiniAdmin does not exist"));
    }

    const business = await Business.findById(businessId);
    if (!business) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Business not found"));
    }

    console.log(business);

    const businessusers = await Businessusers.findOne({
      businessId: businessId,
      userId: loggedInuserId,
    }).session(session);

    console.log(businessusers.role);

    if (!businessusers || businessusers.role === "User") {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            {},
            "Only Admin and MiniAdmin is authorized to do so"
          )
        );
    }

    const target = await Target.findOne({
      businessId: businessId,
      paramName: paramName,
      monthIndex: monthIndex,
      userId: userId,
    }).session(session);

    if (!target) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(400)
        .json(
          new ApiResponse(400, {}, "No target found for the provided details")
        );
    }

    if (newTargetValue) {
      target.targetValue = newTargetValue;
    }

    if (comment) {
      target.comment = comment;
    }

    target.updatedBy = loggedInUser.name;

    await target.save({ session });

    const activity = new Activites({
      userId: userId,
      businessId,
      content: `Target update for parameter ${paramName} to ${target.assignedto}`,
      activityCategory: "Target Update",
    });

    await activity.save({ session });

    await session.commitTransaction();
    session.endSession();

    return res
      .status(200)
      .json(new ApiResponse(200, { target }, "Target updated successfully"));
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error:", error);
    return res
      .status(500)
      .json(new ApiResponse(500, { error }, "Internal Server Error"));
  }
});

export { updateUserTarget };
