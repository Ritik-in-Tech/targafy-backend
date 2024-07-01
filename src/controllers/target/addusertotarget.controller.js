import mongoose from "mongoose";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { Target } from "../../models/target.model.js";
import { User } from "../../models/user.model.js";
import { Business } from "../../models/business.model.js";
import { Params } from "../../models/params.model.js";
import { Businessusers } from "../../models/businessUsers.model.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { Activites } from "../../models/activities.model.js";

const addUserToTarget = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { userIds } = req.body;
    if (!userIds || !Array.isArray(userIds)) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Please provide userIds to add"));
    }

    const userId = req.user._id;
    const targetId = req.params.targetId;

    if (!userId) {
      return res
        .status(400)
        .json(
          new ApiResponse(400, {}, "Session is invalid! Please log in again")
        );
    }

    const target = await Target.findById(targetId).session(session);
    if (!target) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            {},
            "Target not found please check provided target id again"
          )
        );
    }

    const businessId = target.businessId;

    const business = await Business.findById(businessId).session(session);

    const businessUsers = await Businessusers.findOne({
      userId: userId,
      businessId: businessId,
    }).session(session);

    if (!businessUsers || businessUsers.role !== "Admin") {
      return res
        .status(403)
        .json(
          new ApiResponse(403, {}, "Only Admin can assign users to the targets")
        );
    }

    const param = await Params.findOne({
      name: target.paramName,
      businessId,
    }).session(session);

    if (!param) {
      return res
        .status(404)
        .json(
          new ApiResponse(404, {}, "Parameter not found for this business")
        );
    }

    const validUsers = [];
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

      if (target.usersAssigned.some((u) => u.userId.equals(user._id))) {
        await session.abortTransaction();
        session.endSession();
        return res
          .status(400)
          .json(
            new ApiResponse(
              400,
              {},
              `User with id ${user.name} is already assigned to this target`
            )
          );
      }

      validUsers.push({ userId: user._id, name: user.name });
    }

    // Add valid users to the target's usersAssigned array
    target.usersAssigned.push(...validUsers);
    await target.save({ session });

    // Create activity entries for each user
    const activities = validUsers.map((user) => ({
      userId: user.userId,
      businessId,
      content: `Assigned target for parameter ${target.paramName} to ${user.name}`,
      activityCategory: "Target Assignment",
    }));

    // Save activities to the database
    await Activites.insertMany(activities, { session });

    // Update the targetValue in the Business table
    const updatedTargetValue = target.targetValue * target.usersAssigned.length;
    const targetIndex = business.targets.findIndex((t) =>
      t.targetId.equals(target._id)
    );

    if (targetIndex !== -1) {
      business.targets[targetIndex].targetValue = updatedTargetValue;
      await business.save({ session });
    }

    await session.commitTransaction();
    session.endSession();

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { target },
          "Users added to the target successfully and targetValue updated in the business table"
        )
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
