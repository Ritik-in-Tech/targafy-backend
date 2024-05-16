import { Business } from "../../models/business.model.js";
import { Businessusers } from "../../models/businessUsers.model.js";
import { UserUnseenMessageCount } from "../../models/unseenMessageCount.model.js";

import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

const fetchBusinessDetailsAndParams = asyncHandler(async (req, res, next) => {
  const userId = req?.user?._id;
  const businessId = req?.params?.businessId;

  try {
    // Fetch business details
    const business = await Business.findById(businessId);

    if (!business) {
      return res
        .status(401)
        .json(
          new ApiResponse(
            401,
            {},
            "Business not found or user not associated with business!"
          )
        );
    }

    // Fetch user details
    let user = await Businessusers.findOne({
      businessId: businessId,
      userId: userId,
    });

    if (!user || !user?.name || !user?.userId) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            {},
            "User not associated with business or missing required details!"
          )
        );
    }

    let unseenList = await UserUnseenMessageCount.findOne({
      businessId: businessId,
      userId: userId,
    });

    let unseenMessagesCount =
      unseenList == null ? [] : unseenList.unseenMessagesCount || [];

    user = { ...user._doc, unseenMessagesCount };

    // console.log("this is user data : " , user);

    let allSubordinates = user.allSubordinates || [];

    // Construct response data
    const data = {
      business,
      user,
    };

    return res.status(200).json(new ApiResponse(200, data, "Success"));
  } catch (error) {
    // Handle errors
    console.log("This is error", error);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, "Internal server error"));
  }
});

export { fetchBusinessDetailsAndParams };
