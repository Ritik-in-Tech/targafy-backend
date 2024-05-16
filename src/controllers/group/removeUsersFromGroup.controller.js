import mongoose from "mongoose";

import { Businessusers } from "../../models/businessUsers.model.js";
import { Group } from "../../models/group.model.js";

import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

const removeUsersFromGroup = asyncHandler(async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const businessId = req?.params?.businessId;
    const groupId = req?.params?.groupId;
    const userId = req?.user?._id;
    const usersToRemoveIds = req?.body?.usersToRemoveIds;

    if (!businessId || !groupId || !userId || !usersToRemoveIds) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Required parameters are missing"));
    }

    const uniqueUsersToRemoveIds = new Set(usersToRemoveIds);

    if (uniqueUsersToRemoveIds.size != usersToRemoveIds.length) {
      return res
        .status(400)
        .json(
          new ApiResponse(400, {}, "Duplicate values found in usersToRemoveIds")
        );
    }
    // Remove users from the group
    const result = await Group.updateOne(
      { businessId: businessId, groupId: groupId },
      {
        $pull: {
          usersIds: { $in: usersToRemoveIds },
        },
      },
      { session }
    );

    if (result.modifiedCount == 0) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(404)
        .json(new ApiResponse(404, {}, "Group not found or not updated!"));
    }

    // Remove the group from users
    const result2 = await Businessusers.updateMany(
      { businessId: businessId, userId: { $in: usersToRemoveIds } },
      {
        $pull: {
          groupsJoined: groupId,
        },
      },
      {
        session,
      }
    );
    console.log("this is result2 ", result2);

    if (
      result2.modifiedCount == 0 ||
      result2.modifiedCount != usersToRemoveIds.length
    ) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(404)
        .json(
          new ApiResponse(404, {}, "Business not found or no users updated!")
        );
    }

    await session.commitTransaction();
    session.endSession();

    return res
      .status(200)
      .json(
        new ApiResponse(200, {}, "Users removed from the group successfully")
      );
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.log(error);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, "Internal server error"));
  }
});

export { removeUsersFromGroup };
