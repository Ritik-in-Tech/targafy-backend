import { Group } from "../../models/group.model.js";

import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

const updateGroupName = asyncHandler(async (req, res) => {
  const businessId = req?.params?.businessId;
  const groupId = req?.params?.groupId;
  const newName = req?.body?.newName;
  const userId = req?.user?._id;

  if (!businessId || !groupId || !newName || !userId) {
    return res
      .status(400)
      .json(
        new ApiResponse(
          400,
          {},
          "Provide businessId, groupId, newName, and userId"
        )
      );
  }

  try {
    const groupDetails = await Group.findOne({
      businessId: businessId,
      groupId: groupId,
    });

    if (!groupDetails || !groupDetails.name) {
      return res
        .status(404)
        .json(new ApiResponse(404, {}, "The requested group does not exist"));
    }

    const result = await Group.updateOne(
      { businessId: businessId, groupId: groupId },
      { $set: { name: newName } }
    );

    if (result.modifiedCount == 0) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Failed to update group name"));
    }
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Group name updated successfully"));
  } catch (error) {
    console.error("Error updating group name:", error);
    return res
      .status(500)
      .json(
        new ApiResponse(
          500,
          {},
          "An error occurred while updating the group name"
        )
      );
  }
});

export { updateGroupName };
