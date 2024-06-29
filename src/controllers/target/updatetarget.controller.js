import { asyncHandler } from "../../utils/asyncHandler.js";
import { Target } from "../../models/target.model.js";
import { Business } from "../../models/business.model.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

const updateTarget = asyncHandler(async (req, res) => {
  try {
    const updateFields = req.body;
    const { bid, tid } = req.params;

    // Find the business to ensure it exists
    const business = await Business.findById(bid);
    if (!business) {
      return res
        .status(404)
        .json(new ApiResponse(404, {}, "Business not found"));
    }

    // Check if the target ID exists in the business' targets array
    if (!business.targets.includes(tid)) {
      return res
        .status(404)
        .json(new ApiResponse(404, {}, "Target not found in this business"));
    }

    // Find and update the target document directly
    const target = await Target.findByIdAndUpdate(
      tid,
      { $set: updateFields },
      { new: true }
    );

    if (!target) {
      return res.status(404).json(new ApiResponse(404, {}, "Target not found"));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, { target }, "Target updated successfully"));
  } catch (error) {
    console.error("Error:", error);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, "Internal Server Error"));
  }
});

export { updateTarget };
