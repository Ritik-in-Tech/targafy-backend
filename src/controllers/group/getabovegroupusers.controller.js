import { Group } from "../../models/group.model.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

const getAboveGroupUsers = asyncHandler(async (req, res) => {
  try {
    const businessId = req.params.businessId;
    const parentGroupId = req.params.parentGroupId;
    if (!businessId || !parentGroupId) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            {},
            "Parent GroupId and business Id is not provided in the params"
          )
        );
    }
    const group = await Group.findOne({ _id: parentGroupId });
    if (!group) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            {},
            "Group not found the provided parent group Id"
          )
        );
    }
    const userIds = group.userAdded.map((user) => {
      return {
        _id: user.userId,
        name: user.name,
      };
    });
    return res.status(200).json(new ApiResponse(200, userIds, "Success"));
  } catch (error) {
    return res.status(500).json(new ApiResponse(500, {}, error.message));
  }
});

export { getAboveGroupUsers };
