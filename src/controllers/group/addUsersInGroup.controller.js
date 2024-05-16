import mongoose from "mongoose";

import { Businessusers } from "../../models/businessUsers.model.js";
import { Group } from "../../models/group.model.js";

import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

const addUsersInGroup = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const businessId = req?.params?.businessId;
    const groupId = req?.params?.groupId;
    const usersToAddIds = req?.body?.usersToAddIds;

    const uniqueUsersToAddIds = new Set(usersToAddIds);

    if (uniqueUsersToAddIds.size !== usersToAddIds.length) {
      return res
        .status(400)
        .json(
          new ApiResponse(400, {}, "Duplicate values found in usersToAddIds")
        );
    }

    const exitgroup = await Group.findOne({
      businessId: businessId,
      groupId: groupId,
    });

    if (!exitgroup) {
      return res.status(404).json(new ApiResponse(404, {}, "Group not found!"));
    }

    const exitgroupIds = exitgroup?.usersIds
      ? (exitgroup?.usersIds).map((idd) => idd.toHexString())
      : [];
      
    for (let index = 0; index < exitgroupIds.length; index++) {
      let userIdInGroup = exitgroupIds[index];
      if (usersToAddIds.includes(userIdInGroup)) {
        return res
          .status(400)
          .json(
            new ApiResponse(
              400,
              { userId: userIdInGroup },
              `User id ${userIdInGroup} already in group`
            )
          );
      }
    }

    const result = await Group.updateOne(
      { businessId: businessId, groupId: groupId },
      {
        $addToSet: {
          usersIds: { $each: usersToAddIds },
        },
      },
      { session }
    );

    if (result.modifiedCount == 0) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Group not found or not updated!"));
    }

    const result2 = await Businessusers.updateMany(
      { businessId: businessId, userId: { $in: usersToAddIds } },
      {
        $addToSet: {
          groupsJoined: groupId,
        },
      },
      {
        session,
      }
    );

    if (
      result2.modifiedCount == 0 ||
      result2.modifiedCount != usersToAddIds.length
    ) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(400)
        .json(
          new ApiResponse(400, {}, "Business not found or no users updated!")
        );
    }

    await session.commitTransaction();
    session.endSession();

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Users added to the group successfully"));
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.log(error);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, "Internal server error!!"));
  }
});

export { addUsersInGroup };
