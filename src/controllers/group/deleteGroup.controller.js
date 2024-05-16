import mongoose from "mongoose";

import { Businessusers } from "../../models/businessUsers.model.js";
import { Group } from "../../models/group.model.js";

import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

const deleteGroup = asyncHandler(async (req, res) => {
  const businessId = req?.params?.businessId;
  const groupIdToDelete = req?.params?.groupId;

  if (!businessId) {
    return res
      .status(400)
      .json(new ApiResponse(400, {}, "Business Id is not provided!!"));
  }

  if (!groupIdToDelete) {
    return res
      .status(400)
      .json(new ApiResponse(400, {}, "Group Id is not provided!!"));
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const usersInGroup = await Group.findOne({
      businessId: businessId,
      groupId: groupIdToDelete,
    });

    console.log("first")
    console.log(usersInGroup)

    if (!usersInGroup || !usersInGroup.groupId) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(404)
        .json(new ApiResponse(404, {}, "Group not found or not deleted!"));
    }

    const result = await Group.deleteOne(
      { businessId: businessId, groupId: groupIdToDelete },
      { session: session }
    );
    console.log("deleted")
    console.log(result)

    if (result.deletedCount == 0) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(404)
        .json(new ApiResponse(404, {}, "Group not found or not deleted!"));
    }

    const result2 = await Businessusers.updateMany(
      { businessId: businessId, userId: { $in: usersInGroup.usersIds } },
      {
        $pull: {
          groupsJoined: groupIdToDelete,
        },
      },
      { session: session }
    );
    

    if (result2.modifiedCount == 0) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(404)
        .json(
          new ApiResponse(404, {}, "Business not found or user not updated!")
        );
    }

    await session.commitTransaction();
    session.endSession();

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Group deleted successfully"));
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    return res
      .status(500)
      .json(new ApiResponse(500, {}, "Internal Server Error"));
  }
});

export { deleteGroup };
