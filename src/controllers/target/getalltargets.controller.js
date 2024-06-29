import { asyncHandler } from "../../utils/asyncHandler.js";
import { Business } from "../../models/business.model.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

const getAllTargets = asyncHandler(async (req, res) => {
  try {
    const id = req.params.id;
    // console.log(id);
    const business = await Business.findOne({ _id: id }).populate(
      "targets",
      "title details createdBy assignedTo dailyFinishedTarget createdDate deliveryDate nextFollowUpDate status"
    );
    if (!business) {
      return res
        .status(404)
        .json(new ApiResponse(404, {}, "Business not found"));
    }
    return res
      .status(200)
      .json(new ApiResponse(200, { business }, "Target fetched successfully!"));
  } catch (error) {
    console.error("Error:", error);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, "Internal Server Error"));
  }
});

export { getAllTargets };
