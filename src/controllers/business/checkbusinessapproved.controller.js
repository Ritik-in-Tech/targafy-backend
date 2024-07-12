import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { User } from "../../models/user.model.js";
import { Requests } from "../../models/requests.model.js";
import { Business } from "../../models/business.model.js";

export const checkBusinessApproved = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    if (!userId) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Invalid token, please log in again"));
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(400).json(new ApiResponse(400, {}, "User not found"));
    }

    const pendingRequests = await Requests.find({ userId: userId });
    const results = [];

    if (!pendingRequests || pendingRequests.length === 0) {
      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            { results },
            "Pending requests retrieved successfully"
          )
        );
    }

    for (const request of pendingRequests) {
      const businessId = request.businessId;

      const business = await Business.findById(businessId);

      if (business) {
        results.push({
          businessId: business._id,
          businessName: business.name,
        });
      } else {
        console.log(`Business not found for request ${request._id}`);
      }
    }

    return res.json(
      new ApiResponse(200, results, "Pending requests retrieved successfully")
    );
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json(new ApiResponse(500, { error }, "Internal server error"));
  }
});
