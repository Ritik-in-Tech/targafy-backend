import mongoose from "mongoose";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { Target } from "../../models/target.model.js";
import { User } from "../../models/user.model.js";
import { Business } from "../../models/business.model.js";
import { Params } from "../../models/params.model.js";
import { Businessusers } from "../../models/businessUsers.model.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { Activites } from "../../models/activities.model.js";
import moment from "moment-timezone";
import {
  activityNotificationEvent,
  emitNewNotificationEvent,
} from "../../sockets/notification_socket.js";
import { getCurrentIndianTime } from "../../utils/helpers/time.helper.js";
import { formatName, getMonthName } from "../../utils/helpers.js";
moment.tz.setDefault("Asia/Kolkata");
import { Department } from "../../models/department.model.js";

// controllers to add target
const createTarget = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { targetValue, paramName, comment, userIds, monthIndex } = req.body;
    const { businessId, departmentId } = req.params;
    const loggedInuserId = req.user._id;

    if (!businessId || !departmentId) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(400)
        .json(
          new ApiResponse(400, {}, "Business or Department Id is not provided")
        );
    }

    if (
      !targetValue ||
      !paramName ||
      !userIds ||
      !Array.isArray(userIds) ||
      !monthIndex
    ) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Please provide all required fields"));
    }

    const year = moment().year();
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

    const loggedInUser = await User.findById(loggedInuserId).session(session);

    if (!loggedInUser || !loggedInUser.name) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            {},
            "Admin or MiniAdmin does not exist or name does not exist"
          )
        );
    }

    const business = await Business.findById(businessId).session(session);
    if (!business) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(400)
        .json(
          new ApiResponse(400, {}, "Business with the given Id does not exist")
        );
    }

    const department = await Department.findById(departmentId);
    if (!department) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Department not found"));
    }

    const businessUsers = await Businessusers.findOne({
      userId: loggedInuserId,
      businessId: businessId,
      departmentId: departmentId,
    }).session(session);

    if (!businessUsers) {
      await session.abortTransaction();
      session.endSession();
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

    if (businessUsers.role === "User") {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(400)
        .json(
          new ApiResponse(400, {}, "User does not have permission to do so")
        );
    }

    const param = await Params.findOne({
      name: paramName,
      businessId,
      departmentId: departmentId,
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
            "Parameter name does not exist for this business and in the department where you want to set the target"
          )
        );
    }

    const MonthName = getMonthName(month);

    const validUserIds = [];

    for (const userId of userIds) {
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
        departmentId: departmentId,
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
              `User with ID ${userId} is not associated with this business and in the same department`
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
        departmentId: departmentId,
      }).session(session);
      if (existingTarget) {
        await session.abortTransaction();
        session.endSession();
        return res
          .status(400)
          .json(
            new ApiResponse(
              400,
              {},
              `Target with the ${paramName}, ${businessId}, ${monthIndex} and ${user.name} already exists`
            )
          );
      }

      validUserIds.push(user._id);

      const target = new Target({
        targetValue: targetValue,
        paramName: paramName,
        businessId: business._id,
        comment: comment,
        userId: user._id,
        departmentId: departmentId,
        monthIndex: monthIndex,
        assignedBy: loggedInUser.name,
        assignedto: user.name,
      });

      await target.save({ session });

      const userName = formatName(user.name);
      const assignedName = formatName(loggedInUser.name);

      const activity = new Activites({
        userId: user._id,
        businessId,
        content: `${assignedName}: ${userName}(${MonthName} Target ${paramName}) set to ${targetValue}`,
        activityCategory: "Target Assignment",
      });

      await activity.save({ session });

      const emitData = {
        content: `${assignedName}: ${userName}(${MonthName} Target ${paramName}) set to ${targetValue}`,
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
      .status(201)
      .json(new ApiResponse(201, {}, "Target created successfully"));
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error:", error);
    return res
      .status(500)
      .json(new ApiResponse(500, { error }, "Internal Server Error"));
  }
});

export { createTarget };
