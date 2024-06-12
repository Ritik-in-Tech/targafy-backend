import { Business } from "../../models/business.model.js";
import { User } from "../../models/user.model.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

const getBusinessUserDetails = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    console.log(userId);
    if (!userId) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Token is Invalid!!"));
    }

    const user = await User.findById(userId).select("name avatar businesses");
    if (!user) {
      return res.status(400).json(new ApiResponse(400, {}, "User not found"));
    }

    const businessIds = user.businesses.map((business) => business.businessId);
    if (!businessIds.length) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            200,
            { businesses: [], user },
            "No businesses found, but user details fetched successfully"
          )
        );
    }

    const businesses = await Business.find({
      _id: { $in: businessIds },
    }).select("-params -targets");
    if (!businesses.length) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "No businesses found"));
    }

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { businesses, user },
          "Businesses fetched successfully"
        )
      );
  } catch (error) {
    console.error("Error fetching user business details:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export { getBusinessUserDetails };
