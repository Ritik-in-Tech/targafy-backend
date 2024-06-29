import { asyncHandler } from "../../utils/asyncHandler.js";
import { Business } from "../../models/business.model.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

const getTargetById = asyncHandler(async (req, res) => {
  try {
    const { bid, tid } = req.params;

    // Find the business and populate targets
    const business = await Business.findOne({ _id: bid }).populate("targets");

    if (!business) {
      return res
        .status(404)
        .json(new ApiResponse(404, {}, "Business not found"));
    }

    // Find the specific target within the populated targets
    const target = business.targets.find(
      (target) => target._id.toString() === tid
    );

    if (!target) {
      return res.status(404).json(new ApiResponse(404, {}, "Target not found"));
    }

    res
      .status(200)
      .json(new ApiResponse(200, { target }, "Target fetched successfully"));
  } catch (error) {
    console.error("Error:", error);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, "Internal Server Error"));
  }
});

export { getTargetById };
