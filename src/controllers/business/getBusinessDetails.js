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
    const user = await User.findById(userId);
    if (!user) {
      return res.status(400).json(new ApiResponse(400, {}, "User not found"));
    }
    const businessIds = user.businesses.map((business) => business.businessId);
    if (!businessIds) {
      return res
        .status(400)
        .json(
          new ApiResponse(400, {}, "User have not associated with any business")
        );
    }
    const businesses = await Business.find({ _id: { $in: businessIds } });
    if (!businesses) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Some error in api creation"));
    }
    return res
      .status(200)
      .json(
        new ApiResponse(200, { businesses }, "Businesses fetched successfully")
      );
  } catch (error) {
    console.error("Error fetching user business details:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export { getBusinessUserDetails };
