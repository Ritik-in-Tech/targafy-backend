import mongoose from "mongoose";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { Target } from "../../models/target.model.js";
import { User } from "../../models/user.model.js";
import { Business } from "../../models/business.model.js";
import { Params } from "../../models/params.model.js";
import { Businessusers } from "../../models/businessUsers.model.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { Activites } from "../../models/activities.model.js";

// controllers to add target
const createTarget = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { targetValue, paramName, comment, userIds } = req.body;
    const businessId = req.params.businessId;
    const userId = req.user._id;

    // Validate required fields
    if (!targetValue || !paramName || !userIds || !Array.isArray(userIds)) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Please provide all required fields"));
    }

    // Validate business existence
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

    const businessUsers = await Businessusers.findOne({
      userId: userId,
      businessId: businessId,
    }).session(session);

    if (businessUsers.role !== "Admin") {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            {},
            "Only Admin can assign the targets for the params"
          )
        );
    }

    // Validate paramName existence in Params table for the provided businessId
    const param = await Params.findOne({ name: paramName, businessId }).session(
      session
    );
    if (!param) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            {},
            "Parameter name does not exist for this business where you want to set the target"
          )
        );
    }

    // Check if a target with the same paramName and businessId already exists
    const existingTarget = await Target.findOne({
      paramName,
      businessId,
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
            "Target with the same parameter name and business ID already exists"
          )
        );
    }

    // Validate userNames, map to userIds, and check associations
    const validUsers = [];
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
      validUsers.push({ userId: user._id, name: user.name });
    }

    const numericTargetValue = parseFloat(targetValue);
    if (isNaN(numericTargetValue)) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Invalid targetValue"));
    }

    // Calculate savedTargetValue
    const savedTargetValue = numericTargetValue * validUsers.length;

    // Create a new target
    const target = new Target({
      targetValue,
      paramName,
      businessId: business._id,
      comment,
      usersAssigned: validUsers,
    });

    // Save the target to the database
    const savedTarget = await target.save({ session });

    // Create activity entries for each user
    const activities = validUsers.map((user) => ({
      userId: user.userId,
      businessId,
      content: `Assigned target for parameter ${paramName} to ${user.name}`,
      activityCategory: "Target Assignment",
    }));

    // Save activities to the database
    await Activites.insertMany(activities, { session });

    // Add the target reference to the business's targets array
    business.targets.push({
      targetId: savedTarget._id,
      targetName: paramName,
      targetValue: savedTargetValue,
    });

    // Save the updated business
    await business.save({ session });

    await session.commitTransaction();
    session.endSession();

    return res
      .status(201)
      .json(
        new ApiResponse(
          201,
          { target: savedTarget },
          "Target created successfully"
        )
      );
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
