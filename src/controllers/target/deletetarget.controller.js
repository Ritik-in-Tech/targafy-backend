import { asyncHandler } from "../../utils/asyncHandler.js";
import { Target } from "../../models/target.model.js";
import { Business } from "../../models/business.model.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

const deleteTarget = asyncHandler(async (req, res) => {
  try {
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

    // Remove target ID from the business' targets array
    const targetIndex = business.targets.indexOf(tid);
    business.targets.splice(targetIndex, 1);

    // Save the updated business document
    await business.save();

    // Delete the actual Target document from the Target collection
    await Target.findByIdAndDelete(tid);

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Target deleted successfully"));
  } catch (error) {
    console.error("Error:", error);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, "Internal Server Error"));
  }
});

export { deleteTarget };
