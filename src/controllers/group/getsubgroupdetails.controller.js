import { Business } from "../../models/business.model.js";
import { Group } from "../../models/group.model.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

const getSubOfficeDetails = asyncHandler(async (req, res) => {
  try {
    const parentGroupId = req.params.parentId;
    if (!parentGroupId) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Parent group ID not provided"));
    }

    // Fetch the parent group by its ID
    const parentGroup = await Group.findById(parentGroupId);
    if (!parentGroup) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Parent group does not exist"));
    }

    // Extract subordinate group IDs from the parent group's data
    const subordinateGroupIds = parentGroup.subordinateGroups.map(
      (group) => group.subordinateGroupId
    );

    // console.log(subordinateGroupIds);

    if (subordinateGroupIds.length === 0) {
      return res
        .status(200)
        .json(
          new ApiResponse(200, { subGroups: [] }, "No subordinate groups found")
        );
    }

    // Fetch details for each subordinate group by their IDs
    const subordinateGroups = await Group.find({
      _id: { $in: subordinateGroupIds },
    });

    // Map to get the required fields from each subordinate group
    const subGroupsDetails = subordinateGroups.map((subGroup) => ({
      groupId: subGroup._id,
      logo: subGroup.logo,
      subOfficeName: subGroup.officeName,
      userAddedLength: subGroup.userAdded.length,
    }));

    // Return the filtered subordinate group details
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { subOffices: subGroupsDetails },
          "Sub-offices fetched successfully"
        )
      );
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json(new ApiResponse(500, { error }, "Internal Server Error"));
  }
});

export { getSubOfficeDetails };
