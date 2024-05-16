
import { Business } from "../../models/business.model.js";

import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

const getBusinessLogo = asyncHandler(async (req, res) => {
  try {
    const businessId = req?.params?.businessId;
    const business = await Business.findOne({ _id: businessId });

    if (!business || !business._id) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Business does not exist!!"));
    }

    if (!business.logo) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Business logo does not exist!!"));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, { logo: business?.logo }, "Business logo"));
  } catch (error) {
    console.error("Error getting business logo:", error);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, "Internal server error"));
  }
});

export { getBusinessLogo };
