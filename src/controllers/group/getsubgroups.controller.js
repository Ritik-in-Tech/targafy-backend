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
      parameterAssigned: param.name,
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
    const groupId = req.params.groupId;

    const level2 = await Params.findById(groupId);

    if (!level2) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            {},
            "level 2 not found for the provided group details"
          )
        );
    }

    if (level2.subOrdinateGroups.length === 0) {
      const formattedUsers = level2.usersAssigned.map((user) => ({
        name: user.name,
        userId: user.userId,
        parameterAssigned: level2.name,
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

    const levelDetails = level2.subOrdinateGroups.map((group) => ({
      _id: group.groupId,
      groupName: group.groupName,
      parameterAssigned: level2.name,
    }));

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { level2: levelDetails },
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

const sublevelGroupName = asyncHandler(async (req, res) => {
  try {
    const aboveLevelGroupId = req.params.aboveLevelGroupId;
    // const businessId = req.params.businessId;
    // const aboveLevelGroupName = req.params.aboveLevelGroupName;
    // const parameterAssigned = req.body.parameterAssigned;
    // if (!businessId || !aboveLevelGroupName || !parameterAssigned) {
    //   return res
    //     .status(400)
    //     .json(new ApiResponse(400, {}, "Params all field not provided"));
    // }
    // console.log(businessId);
    // console.log(aboveLevelGroupName);
    // const business = await Business.findById(businessId);
    // if (!business) {
    //   return res
    //     .status(400)
    //     .json(
    //       new ApiResponse(
    //         400,
    //         {},
    //         "Business does not exist for the provided businessId"
    //       )
    //     );
    // }
    // const userId = req.user._id;
    // if (!userId) {
    //   return res
    //     .status(400)
    //     .json(new ApiResponse(400, {}, "Invalid token please log in again"));
    // }
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
        parameterAssigned: groupexistence.parameterAssigned,
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
      groupName: group.subordinategroupName,
      parameterAssigned: groupexistence.parameterAssigned,
    }));

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { sublevel: formattedGroups },
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
