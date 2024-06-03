import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Target } from "../models/target.model.js";
import { User } from "../models/user.model.js";
import { Business } from "../models/business.model.js";
import { Params } from "../models/params.model.js";
import { Businessusers } from "../models/businessUsers.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Activites } from "../models/activities.model.js";

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

// controller to add user to existing target
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
    const paramName = req.params.name;
    const businessId = req.params.businessId;

    if (!userId) {
      return res
        .status(400)
        .json(
          new ApiResponse(400, {}, "Session is invalid! Please log in again")
        );
    }

    if (!paramName || !businessId) {
      return res
        .status(400)
        .json(
          new ApiResponse(400, {}, "Business Id and param name is not provided")
        );
    }

    const business = await Business.findById(businessId).session(session);

    // Validate business existence
    if (!business) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Please provide a valid businessId"));
    }

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

    const param = await Params.findOne({ name: paramName, businessId }).session(
      session
    );

    if (!param) {
      return res
        .status(404)
        .json(
          new ApiResponse(404, {}, "Parameter not found for this business")
        );
    }

    const target = await Target.findOne({
      paramName: paramName,
      businessId: businessId,
    }).session(session);

    if (!target) {
      return res
        .status(404)
        .json(new ApiResponse(404, {}, "Target is not set for this business"));
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
      content: `Assigned target for parameter ${paramName} to ${user.name}`,
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
  }
});

// controllers to get parameters and target values
const getTargetValues = asyncHandler(async (req, res) => {
  try {
    const businessId = req.params.businessId;
    const business = await Business.findById(businessId);

    if (!business) {
      return res
        .status(404)
        .json(new ApiResponse(404, {}, "Business not found"));
    }

    const targets = await Target.find({ businessId: businessId });

    // if (!targets || targets.length === 0) {
    //   return res
    //     .status(404)
    //     .json(
    //       new ApiResponse(
    //         404,
    //         {},
    //         "No targets found for the provided business Id"
    //       )
    //     );
    // }

    const targetValues = targets.map((target) => {
      const targetValueNumber = parseFloat(target.targetValue);
      const numberOfUsersAssigned = target.usersAssigned.length;
      const totalTargetValue = targetValueNumber * numberOfUsersAssigned;
      return {
        targetName: target.paramName,
        totalTargetValue: totalTargetValue,
      };
    });

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          targetValues,
          "Target values retrieved successfully"
        )
      );
  } catch (error) {
    console.error("Error:", error);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, "Internal Server Error"));
  }
});

// Get all targets
const getAllTargets = asyncHandler(async (req, res) => {
  try {
    const id = req.params.id;
    // console.log(id);
    const business = await Business.findOne({ _id: id }).populate(
      "targets",
      "title details createdBy assignedTo dailyFinishedTarget createdDate deliveryDate nextFollowUpDate status"
    );
    if (!business) {
      return res
        .status(404)
        .json(new ApiResponse(404, {}, "Business not found"));
    }
    return res
      .status(200)
      .json(new ApiResponse(200, { business }, "Target fetched successfully!"));
  } catch (error) {
    console.error("Error:", error);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, "Internal Server Error"));
  }
});

// Get target by ID
const getTargetById = asyncHandler(async (req, res) => {
  try {
    const { bid, tid } = req.params;

    // Find the business and populate targets
    const business = await Business.findOne({ _id: bid }).populate("targets");

    if (!business) {
      return res
        .status(404)
        .json(new ApiResponse(404, {}, "Business not found"));
    }

    // Find the specific target within the populated targets
    const target = business.targets.find(
      (target) => target._id.toString() === tid
    );

    if (!target) {
      return res.status(404).json(new ApiResponse(404, {}, "Target not found"));
    }

    res
      .status(200)
      .json(new ApiResponse(200, { target }, "Target fetched successfully"));
  } catch (error) {
    console.error("Error:", error);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, "Internal Server Error"));
  }
});

// Update target by ID
const updateTarget = asyncHandler(async (req, res) => {
  try {
    const updateFields = req.body;
    const { bid, tid } = req.params;

    // Find the business to ensure it exists
    const business = await Business.findById(bid);
    if (!business) {
      return res
        .status(404)
        .json(new ApiResponse(404, {}, "Business not found"));
    }

    // Check if the target ID exists in the business' targets array
    if (!business.targets.includes(tid)) {
      return res
        .status(404)
        .json(new ApiResponse(404, {}, "Target not found in this business"));
    }

    // Find and update the target document directly
    const target = await Target.findByIdAndUpdate(
      tid,
      { $set: updateFields },
      { new: true }
    );

    if (!target) {
      return res.status(404).json(new ApiResponse(404, {}, "Target not found"));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, { target }, "Target updated successfully"));
  } catch (error) {
    console.error("Error:", error);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, "Internal Server Error"));
  }
});

// Delete target by ID
const deleteTarget = asyncHandler(async (req, res) => {
  try {
    const { bid, tid } = req.params;

    // Find the business to ensure it exists
    const business = await Business.findById(bid);
    if (!business) {
      return res
        .status(404)
        .json(new ApiResponse(404, {}, "Business not found"));
    }

    // Check if the target ID exists in the business' targets array
    if (!business.targets.includes(tid)) {
      return res
        .status(404)
        .json(new ApiResponse(404, {}, "Target not found in this business"));
    }

    // Remove target ID from the business' targets array
    const targetIndex = business.targets.indexOf(tid);
    business.targets.splice(targetIndex, 1);

    // Save the updated business document
    await business.save();

    // Delete the actual Target document from the Target collection
    await Target.findByIdAndDelete(tid);

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Target deleted successfully"));
  } catch (error) {
    console.error("Error:", error);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, "Internal Server Error"));
  }
});

export {
  createTarget,
  getAllTargets,
  getTargetById,
  updateTarget,
  deleteTarget,
  getTargetValues,
  addUserToTarget,
};
