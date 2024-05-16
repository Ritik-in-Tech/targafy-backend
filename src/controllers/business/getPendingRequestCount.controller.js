import { Requests } from "../../models/requests.model.js";

import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

const getPendingRequestCount = asyncHandler(async (req, res, next) => {
  try {
    const businessId = req?.params?.businessId;
    const userId = req?.user?._id;

    // Add input validation for businessId and userId if necessary

    const requests = await Requests.find({ businessId: businessId });

    // console.log(business);

    if (!requests) {
      return res
        .status(404)
        .json(new ApiResponse(404, {}, "Business or requests not found"));
    }

    const requestCount = requests?.length || 0;

    return res
      .status(200)
      .json(new ApiResponse(200, { requestCount }, "Request count"));
  } catch (error) {
    // Handle errors appropriately (e.g., send an error response or log the error)
    console.error(error);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, "Internal server error"));
  }
});

export default getPendingRequestCount;
