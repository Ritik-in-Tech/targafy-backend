import mongoose from "mongoose";
const { startSession } = mongoose;

import { Businessusers } from "../../models/businessUsers.model.js";
import { Group } from "../../models/group.model.js";

import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

const createGroup = asyncHandler(async (req, res, next) => {
  const session = await startSession();
  session.startTransaction();

  try {
    const businessId = req?.params?.businessId;
    const userId = req?.user?._id;
    const name = req?.body?.name;
    const usersToAddIds = req?.body?.usersToAddIds;

    const uniqueUsersToAddIds = new Set(usersToAddIds);

    if (uniqueUsersToAddIds.size !== usersToAddIds.length) {
      return res
        .status(400)
        .json(
          new ApiResponse(400, {}, "Duplicate values found in usersToAddIds")
        );
    }

    usersToAddIds.push(userId);

    if (!userId) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Token is Invalid!!"));
    }

    if (!name) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Fill name of group!!"));
    }

    if (!businessId) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Business Id is not provided!!"));
    }

    const newGroupId = new mongoose.Types.ObjectId();

    const newGroup = {
      businessId: businessId,
      name: name,
      groupId: newGroupId,
      usersIds: usersToAddIds,
    };

    const result = await Group.create([newGroup], { session: session });

    const group = result[0];
    const result2 = await Businessusers.updateMany(
      { businessId: businessId, userId: { $in: usersToAddIds } },
      {
        $addToSet: {
          groupsJoined: newGroupId,
        },
      }
    );

    if (
      result2.modifiedCount == 0 ||
      result2.modifiedCount != usersToAddIds.length
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
        new ApiResponse(200, { newGroup: group }, "Group created successfully")
      );
  } catch (error) {
    console.log(error);
    await session.abortTransaction();
    session.endSession();
    return res
      .status(500)
      .json(new ApiResponse(500, {}, "Internal Server Error"));
  }
});

export { createGroup };
