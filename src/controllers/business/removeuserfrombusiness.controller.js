import mongoose from "mongoose";
const { startSession } = mongoose;

import { User } from "../../models/user.model.js";
import { Businessusers } from "../../models/businessUsers.model.js";
import { Acceptedrequests } from "../../models/acceptedRequests.model.js";

import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

const removeUserFromBusiness = asyncHandler(async (req, res, next) => {
  const userToRemoveId = req.params?.userToRemoveId;
  const businessId = req.params?.businessId;

  if (!userToRemoveId || !businessId) {
    return res
      .status(400)
      .json(new ApiResponse(400, {}, "Provide userToRemoveId and businessId"));
  }

  const session = await startSession();
  session.startTransaction();

  try {
    const user = await Businessusers.findOne({
      businessId: businessId,
      userId: userToRemoveId,
    });

    if (!user) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(500)
        .json(new ApiResponse(500, {}, "User not found in the business"));
    }

    const parent = await Businessusers.findOne({
      businessId: businessId,
      userId: user?.parentId,
    });

    if (!parent) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(404)
        .json(
          new ApiResponse(404, {}, "User manager not found in the business")
        );
    }

    const subordinates = user?.subordinates || [];

    // Update parent user of the user's subordinates
    await Businessusers.updateMany(
      { businessId: businessId, userId: { $in: subordinates } },
      {
        $set: {
          parentId: user.parentId,
        },
      },
      { session }
    );

    // Remove user from the business and update related data
    await Businessusers.updateMany(
      { businessId: businessId },
      {
        $pull: {
          subordinates: userToRemoveId,
          allSubordinates: userToRemoveId,
        },
      },
      { session }
    );

    // Add subordinates in users parent subordinates array
    await Businessusers.updateOne(
      { businessId: businessId, userId: user.parentId },
      {
        $addToSet: {
          subordinates: { $each: subordinates },
        },
      },
      { session }
    );

    await User.updateOne(
      { _id: userToRemoveId },
      {
        $pull: {
          businesses: { businessId },
        },
      },
      { session }
    );

    // Delete the user from the business
    await Businessusers.deleteOne(
      { businessId: businessId, userId: userToRemoveId },
      { session }
    );

    await Acceptedrequests.deleteOne(
      { businessId: businessId, userId: userToRemoveId },
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    return res
      .status(200)
      .json(
        new ApiResponse(200, {}, "User removed from business successfully")
      );
  } catch (error) {
    console.error("Error while removing user :", error);
    await session.abortTransaction();
    session.endSession();
    return res
      .status(500)
      .json(new ApiResponse(500, {}, "Internal Server Error"));
  }
});

export { removeUserFromBusiness };
