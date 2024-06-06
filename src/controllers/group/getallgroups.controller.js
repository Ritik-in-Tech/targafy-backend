import { Business } from "../../models/business.model.js";
import { Group } from "../../models/group.model.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

const getAllGroups = asyncHandler(async (req, res) => {
  try {
    const businessId = req.params.businessId;
    if (!businessId) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Please provide businessId in params"));
    }
    const business = await Business.findById(businessId);
    if (!business) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Business not exist"));
    }
    const groups = await Group.find(
      { businessId: businessId },
      { groupName: 1, logo: 1, userAdded: 1, _id: 1 }
    );
    if (groups.length === 0) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            {},
            "There is not any group for this business exist"
          )
        );
    }

    const formattedGroups = groups.map((group) => ({
      _id: group._id,
      groupName: group.groupName,
      logo: group.logo,
      userAddedLength: group.userAdded.length,
    }));

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { groups: formattedGroups },
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

export { getAllGroups };
