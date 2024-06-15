import { Business } from "../../models/business.model.js";
import { Group } from "../../models/group.model.js";
import { Params } from "../../models/params.model.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

const level1GroupName = asyncHandler(async (req, res) => {
  try {
    const businessId = req.params.businessId;
    if (!businessId) {
      return res
        .status(400)
        .json(
          new ApiResponse(400, {}, "Business Id is not provided in the params")
        );
    }
    const userId = req.user._id;
    if (!userId) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Invalid token! Please log in again"));
    }
    const business = await Business.findById(businessId);
    if (!business) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            {},
            "Business not exist for the provided business Id"
          )
        );
    }
    const paramDetails = await Params.find({ businessId: businessId });
    if (paramDetails.length === 0) {
      return res
        .status(404)
        .json(
          new ApiResponse(
            404,
            {},
            "No params found for the provided business Id"
          )
        );
    }
    // console.log(paramDetails);

    const formattedParams = paramDetails.map((param) => ({
      _id: param._id,
      name: param.name,
    }));

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { level1: formattedParams },
          "Params fetched successfully!"
        )
      );
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json(new ApiResponse(500, { error }, "Internal server error"));
  }
});

const level2GroupName = asyncHandler(async (req, res) => {
  try {
    const businessId = req.params.businessId;
    const level2 = await Group.find(
      { businessId: businessId, parentGroupId: { $exists: false } },
      { officeName: 1, _id: 1 } // Only fetch officeName and _id fields
    );

    if (!level2 || level2.length === 0) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            {},
            "Level 2 groups not found for the provided business details"
          )
        );
    }

    const levelDetails = level2.map((group) => ({
      _id: group._id,
      officeName: group.officeName,
    }));

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { level2: levelDetails },
          "Level 2 groups fetched successfully!"
        )
      );
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json(new ApiResponse(500, { error }, "Internal server error"));
  }
});

const sublevelGroupName = asyncHandler(async (req, res) => {
  try {
    const aboveLevelGroupId = req.params.aboveLevelGroupId;
    const groupexistence = await Group.findById(aboveLevelGroupId);
    if (!groupexistence) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            {},
            "Group does not exist for the provided details"
          )
        );
    }

    if (groupexistence.subordinateGroups.length === 0) {
      const formattedUsers = groupexistence.userAdded.map((user) => ({
        name: user.name,
        userId: user.userId,
      }));

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            { users: formattedUsers },
            "Users fetched successfully!"
          )
        );
    }
    const formattedGroups = groupexistence.subordinateGroups.map((group) => ({
      _id: group.subordinateGroupId,
      officeName: group.subordinategroupName,
    }));

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { suboffices: formattedGroups },
          "Groups fetched successfully!"
        )
      );
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json(new ApiResponse(500, { error }, "Internal server error"));
  }
});
export { level1GroupName, sublevelGroupName, level2GroupName };
