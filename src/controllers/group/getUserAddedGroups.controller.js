
import { Businessusers } from "../../models/businessUsers.model.js";
import { Group } from "../../models/group.model.js";

import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

const getUserAddedGroups = asyncHandler(async (req, res, next) => {
  try {
    const userId = req?.user?._id;
    const businessId = req?.params?.businessId;

    if (!userId) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Token is Invalid!!"));
    }

    if (!businessId) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Business Id is not provided!!"));
    }

    const userData = await Businessusers.findOne({
      businessId: businessId,
      userId: userId,
    });

    console.log(userData);

    if (!userData) {
      return res
        .status(404)
        .json(new ApiResponse(404, {}, "User not found in business"));
    }

    const groupsJoined = userData?.groupsJoined || [];

    const groups = await Group.find({
      businessId: businessId,
      groupId: { $in: groupsJoined },
    }).lean();

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { groups: groups },
          "User group fetch successfully"
        )
      );
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, "Internal Server Error"));
  }
});

export { getUserAddedGroups };
