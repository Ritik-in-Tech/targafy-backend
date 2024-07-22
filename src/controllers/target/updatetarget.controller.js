import { asyncHandler } from "../../utils/asyncHandler.js";
import { Target } from "../../models/target.model.js";
import { Business } from "../../models/business.model.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { User } from "../../models/user.model.js";
import { Businessusers } from "../../models/businessUsers.model.js";
import { Activites } from "../../models/activities.model.js";
import mongoose from "mongoose";
import { getCurrentIndianTime } from "../../utils/helpers/time.helper.js";
import { activityNotificationEvent } from "../../sockets/notification_socket.js";
import { Params } from "../../models/params.model.js";
import { getMonthName } from "../../utils/helpers.js";

const updateUserTarget = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { userTargets, comment, monthIndex } = req.body;
    if (!userTargets || !Array.isArray(userTargets) || !monthIndex) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Please provide all required fields"));
    }

    const { paramName, businessId } = req.params;
    if (!paramName || !businessId) {
      await session.abortTransaction();
      session.endSession();
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

    const month = parseInt(monthIndex, 10);

    if (isNaN(month) || month < 1 || month > 12) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            {},
            "Invalid month value provided. Must be between 1 and 12"
          )
        );
    }

    const loggedInuserId = req.user._id;
    if (!loggedInuserId) {
      await session.abortTransaction();
      session.endSession();
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

    const businessusers = await Businessusers.findOne({
      businessId: businessId,
      userId: loggedInuserId,
    }).session(session);

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

    const param = await Params.findOne({
      name: paramName,
      businessId,
    }).session(session);
    if (!param) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            {},
            "Parameter name does not exist for this business where you want to update the target"
          )
        );
    }

    const MonthName = getMonthName(month);
    // const validUserIds = [];
    for (const { userId, newTargetValue } of userTargets) {
      const user = await User.findOne({ _id: userId }).session(session);
      if (!user) {
        await session.abortTransaction();
        session.endSession();
        return res
          .status(400)
          .json(
            new ApiResponse(400, {}, `User with ID ${userId} does not exist`)
          );
      }

      const businessUser = await Businessusers.findOne({
        userId: user._id,
        businessId,
      }).session(session);
      if (!businessUser) {
        await session.abortTransaction();
        session.endSession();
        return res
          .status(400)
          .json(
            new ApiResponse(
              400,
              {},
              `User with ID ${userId} is not associated with this business`
            )
          );
      }

      const userAssigned = param.usersAssigned.some((u) =>
        u.userId.equals(user._id)
      );
      if (!userAssigned) {
        await session.abortTransaction();
        session.endSession();
        return res
          .status(400)
          .json(
            new ApiResponse(
              400,
              {},
              `User with ID ${userId} is not assigned to this parameter`
            )
          );
      }

      const existingTarget = await Target.findOne({
        paramName,
        businessId,
        monthIndex,
        userId: user._id,
      }).session(session);

      existingTarget.targetValue = newTargetValue;
      existingTarget.updatedBy = loggedInUser.name;

      await existingTarget.save({ session });

      const activity = new Activites({
        userId: user._id,
        businessId,
        content: `Target update -> ${user.name} (${MonthName} ${paramName}): ${newTargetValue}`,
        activityCategory: "Target Update",
      });

      await activity.save({ session });

      const emitData = {
        content: `Target Update -> ${user.name} (${MonthName} ${paramName}): ${newTargetValue}`,
        notificationCategory: "target",
        createdDate: getCurrentIndianTime(),
        businessName: business.name,
        businessId: business._id,
      };
      await activityNotificationEvent(userId, emitData);
    }

    await session.commitTransaction();
    session.endSession();

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Targets updated successfully"));
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
