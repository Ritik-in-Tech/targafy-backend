import { Business } from "../../models/business.model.js";
import { Group } from "../../models/group.model.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

const getSubGroupDetails = asyncHandler(async (req, res) => {
  try {
    const businessId = req.params.businessId;
    const parentGroupId = req.params.parentId;
    if (!businessId || !parentGroupId) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Params all field not provided"));
    }
    const business = await Business.findById(businessId);
    if (!business) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            {},
            "Business does not exist for the provided businessId"
          )
        );
    }
    const userId = req.user._id;
    if (!userId) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Invalid token please log in again"));
    }
    const parentGroupExistence = await Group.findById(parentGroupId);
    if (!parentGroupExistence) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            {},
            "Parent Group does not exist for the provided details"
          )
        );
    }

    const subGroups = await Group.find({
      businessId: businessId,
      parentGroupId: parentGroupId,
    });
    return res
      .status(200)
      .json(
        new ApiResponse(200, { subGroups }, "sub-groups fetched successfully")
      );
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json(new ApiResponse(500, { error }, "Internal Server error"));
  }
});

export { getSubGroupDetails };
