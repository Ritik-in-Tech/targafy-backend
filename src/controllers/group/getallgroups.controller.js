import { Business } from "../../models/business.model.js";
import { Group } from "../../models/group.model.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

const getAllHeadOffices = asyncHandler(async (req, res) => {
  try {
    const businessId = req.params.businessId;

    // Check if businessId is provided
    if (!businessId) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Please provide businessId in params"));
    }

    // Check if the business exists
    const business = await Business.findById(businessId);
    if (!business) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Business does not exist"));
    }

    // Fetch groups that belong to the business and do not have a parentGroupId
    const groups = await Group.find(
      { businessId: businessId, parentGroupId: { $exists: false } },
      { officeName: 1, logo: 1, userAdded: 1, _id: 1 }
    );

    // Check if any groups were found
    if (groups.length === 0) {
      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            { groups: [] },
            "No head group exist for this business"
          )
        );
    }

    // Format the groups as needed
    const formattedGroups = groups.map((group) => ({
      _id: group._id,
      headOfficeName: group.officeName,
      logo: group.logo,
      userAddedLength: group.userAdded.length,
    }));

    // Send the response
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { headOffice: formattedGroups },
          "Head office fetched successfully!"
        )
      );
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json(new ApiResponse(500, { error }, "Internal server error"));
  }
});

const getGroupId = asyncHandler(async (req, res) => {
  try {
    const businessId = req.params.businessId;
    const groupName = req.params.groupName;
    if (!businessId || !groupName || !parameterAssigned) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            {},
            "Please provide businessId ,group name and parameterAssigned in params"
          )
        );
    }

    const group = await Group.findOne({
      businessId: businessId,
      groupName: groupName,
      parameterAssigned: parameterAssigned,
    });

    if (!group) {
      return res
        .status(400)
        .json(
          new ApiResponse(400, {}, "Group not found for the provided deatils")
        );
    }
    const groupId = group._id;
    return res
      .status(200)
      .json(
        new ApiResponse(200, { groupId }, "Please provide businessId in params")
      );
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json(new ApiResponse(500, { error }, "Internal server error"));
  }
});

const getGroupDetails = asyncHandler(async (req, res) => {
  try {
    const groupId = req.params.groupId;
    // const businessId = req.params.businessId;
    // const groupName = req.params.groupName;
    // const parameterAssigned = req.params.parameterAssigned;
    // if (!businessId || !groupName || !parameterAssigned) {
    //   return res
    //     .status(400)
    //     .json(
    //       new ApiResponse(
    //         400,
    //         {},
    //         "Please provide businessId ,group name and parameterAssigned in params"
    //       )
    //     );
    // }

    const groupDetails = await Group.findById(groupId);

    if (!groupDetails) {
      return res
        .status(400)
        .json(
          new ApiResponse(400, {}, "Group not found for the provided deatils")
        );
    }
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { groupDetails },
          "Group details fetched successfully!"
        )
      );
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json(new ApiResponse(500, { error }, "Internal server error"));
  }
});

export { getAllHeadOffices, getGroupId, getGroupDetails };
