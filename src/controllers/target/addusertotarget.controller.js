import mongoose from "mongoose";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { Target } from "../../models/target.model.js";
import { User } from "../../models/user.model.js";
import { Business } from "../../models/business.model.js";
import { Params } from "../../models/params.model.js";
import { Businessusers } from "../../models/businessUsers.model.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { Activites } from "../../models/activities.model.js";
import { activityNotificationEvent } from "../../sockets/notification_socket.js";
import { formatName, getMonthName } from "../../utils/helpers.js";

const addUserToTarget = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { userIds, monthIndex } = req.body;
    if (!userIds || !Array.isArray(userIds) || !monthIndex) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(400)
        .json(
          new ApiResponse(400, {}, "Please provide userIds and monthIndex")
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

    const MonthName = getMonthName(month);

    const { paramName, businessId } = req.params;
    if (!paramName || !businessId) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(400)
        .json(
          new ApiResponse(400, {}, "Please provide param name and businessId")
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

    const loggedInUser = await User.findById(loggedInuserId);

    const business = await Business.findById(businessId).session(session);
    if (!business) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Business not found"));
    }

    const businessUsers = await Businessusers.findOne({
      userId: loggedInuserId,
      businessId: businessId,
    }).session(session);

    if (!businessUsers || businessUsers.role === "User") {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(403)
        .json(
          new ApiResponse(
            403,
            {},
            "Only Admin and MiniAdmin can assign users to the targets"
          )
        );
    }

    const param = await Params.findOne({
      name: paramName,
      businessId,
    }).session(session);

    if (!param) {
      return res
        .status(404)
        .json(
          new ApiResponse(404, {}, "Parameter not found for this business")
        );
    }
    const validUserIds = [];
    for (const userId of userIds) {
      const user = await User.findById(userId).session(session);
      if (!user) {
        await session.abortTransaction();
        session.endSession();
        return res
          .status(400)
          .json(
            new ApiResponse(400, {}, `User with id ${userId} does not exist`)
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
              `User with id ${user.name} is not associated with this business`
            )
          );
      }

      if (!param.usersAssigned.some((u) => u.userId.equals(user._id))) {
        await session.abortTransaction();
        session.endSession();
        return res
          .status(400)
          .json(
            new ApiResponse(
              400,
              {},
              `User with id ${user.name} is not assigned to this parameter`
            )
          );
      }

      const target = await Target.find({
        paramName: paramName,
        monthIndex: monthIndex,
        businessId: businessId,
      });

      if (!target || target.length === 0) {
        await session.abortTransaction();
        session.endSession();
        return res
          .status(400)
          .json(
            new ApiResponse(
              400,
              {},
              `There is not any target with the provided details`
            )
          );
      }

      // console.log(target);
      const userExistsInTarget = target.some((t) => t.userId.equals(user._id));
      // console.log(userExistsInTarget);

      // console.log(target[0].targetValue);
      if (userExistsInTarget) {
        await session.abortTransaction();
        session.endSession();
        return res
          .status(400)
          .json(
            new ApiResponse(
              400,
              {},
              `User with name ${user.name} is already in the target`
            )
          );
      }

      const newtarget = new Target({
        targetValue: target[0].targetValue,
        paramName: paramName,
        businessId: business._id,
        comment: target[0].comment,
        userId: user._id,
        monthIndex: monthIndex,
        assignedBy: loggedInUser.name,
        assignedto: user.name,
      });

      validUserIds.push(userId);

      await newtarget.save({ session });

      const userName = formatName(user.name);
      const assignedName = formatName(loggedInUser.name);

      const activity = new Activites({
        userId: user._id,
        businessId,
        content: `${assignedName}: ${userName}(${MonthName} Target ${paramName}) set to ${target[0].targetValue}`,
        activityCategory: "Target Assignment",
      });

      await activity.save({ session });

      const emitData = {
        content: `${assignedName}: ${userName}(${MonthName} Target ${paramName}) set to ${target[0].targetValue}`,
        notificationCategory: "target",
        createdDate: getCurrentIndianTime(),
        businessName: business.name,
        businessId: business._id,
      };
      await activityNotificationEvent(userId, emitData);
    }

    // for (const userId of validUserIds) {
    //   const user = await User.findById(userId);
    //   const emitData = {
    //     content: `Target assigned -> ${user.name} (${getMonthName} ${paramName}): ${target[0].targetValue}`,
    //     notificationCategory: "target",
    //     createdDate: getCurrentIndianTime(),
    //     businessName: business.name,
    //     businessId: business._id,
    //   };
    //   await activityNotificationEvent(userId, emitData);
    // }

    await session.commitTransaction();
    session.endSession();

    return res
      .status(200)
      .json(
        new ApiResponse(200, {}, "Users added to the target successfully ")
      );
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error:", error);
    return res
      .status(500)
      .json(new ApiResponse(500, { error }, "Internal Server Error"));
  } finally {
    session.endSession();
  }
});

export { addUserToTarget };
