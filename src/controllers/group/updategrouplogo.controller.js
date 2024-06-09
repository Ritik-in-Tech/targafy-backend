import { Businessusers } from "../../models/businessUsers.model.js";
import { Group } from "../../models/group.model.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

const updateGroupLogo = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    if (!userId) {
      return res
        .status(401) // Unauthorized, since token is invalid
        .json(new ApiResponse(401, {}, "Invalid token, please log in again"));
    }

    const groupId = req.params.groupId;
    if (!groupId) {
      return res
        .status(400) // Bad Request, groupId not provided
        .json(
          new ApiResponse(400, {}, "GroupId is not provided in the params")
        );
    }

    // Assuming the businessId comes from the request or user's context.
    const businessId = req.params.businessId;
    if (!businessId) {
      return res
        .status(400) // Bad Request, businessId not provided
        .json(new ApiResponse(400, {}, "BusinessId is not provided"));
    }

    const businessUser = await Businessusers.findOne({
      businessId: businessId,
      userId: userId,
    });

    if (!businessUser || businessUser.role !== "Admin") {
      return res
        .status(403) // Forbidden, user is not an Admin
        .json(
          new ApiResponse(403, {}, "Only Admin can update the group details")
        );
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res
        .status(404) // Not Found, group does not exist
        .json(
          new ApiResponse(404, {}, "Group not found for the provided groupId")
        );
    }

    const logo = req.body.logo;
    if (!logo) {
      return res
        .status(400) // Bad Request, logo URL not provided
        .json(new ApiResponse(400, {}, "Please provide the logo URL"));
    }

    group.logo = logo;
    await group.save();

    return res
      .status(200) // OK, update successful
      .json(
        new ApiResponse(
          200,
          { id: groupId, newLogo: group.logo },
          "Logo updated successfully!"
        )
      );
  } catch (error) {
    console.error(error);
    return res
      .status(500) // Internal Server Error
      .json(new ApiResponse(500, { error }, "Internal server error"));
  }
});

export { updateGroupLogo };
