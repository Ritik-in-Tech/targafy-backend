import { User } from "../../models/user.model.js";
import { Businessusers } from "../../models/businessUsers.model.js";
import { Requests } from "../../models/requests.model.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

const getUser = asyncHandler(async (req, res, next) => {
  const userId = req?.user?._id;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "User does not exist!!"));
    }

    const businessesWithData = [];

    for (const business of user.businesses) {
      const businessUser = await Businessusers.findOne({
        userId: userId,
        businessId: business?.businessId,
      });

      let pendingRequests = 0;
      if (businessUser.role == "Admin" || businessUser.role == "MiniAdmin") {
        // Fetch pending request count for the business
        pendingRequests = await Requests.find({
          businessId: business?.businessId,
        });
      }

      // Prepare additional data for the business
      const additionalData = {
        pendingRequest: pendingRequests?.length || 0,
        userRole: businessUser ? businessUser?.role || "User" : "User",
        activityCounter: businessUser
          ? businessUser?.activityViewCounter || 0
          : 0,
      };

      // Construct business data with additional details
      const businessData = {
        ...business.toObject(), // Spread business data
        ...additionalData, // Spread additional data
      };

      businessesWithData.push(businessData);
    }

    const responseData = {
      _id: user._id,
      name: user.name,
      jobTitle: user.jobTitle,
      contactNumber: user.contactNumber,
      notificationViewCounter: user.notificationViewCounter,
      email: user.email,
      businesses: businessesWithData,
      // avatar: user.avatar, // avatar added to get the avatar
    };

    return res
      .status(200)
      .json(new ApiResponse(200, responseData, "User data"));
  } catch (error) {
    console.error("Error in getUser:", error);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, "Internal Server Error"));
  }
});

export { getUser };
