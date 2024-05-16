import mongoose from "mongoose";

import { Declinedrequests } from "../../models/declinedRequests.model.js";

import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

const getBusinessDeclinedRequests = asyncHandler(async (req, res, next) => {
  try {
    const businessId = req?.params?.businessId;

    if (!businessId) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Specify business id!!"));
    }

    let requests = await Declinedrequests.find({
      businessId: new mongoose.Types.ObjectId(businessId),
    });

    return res
      .status(200)
      .json(
        new ApiResponse(200, { requests: requests || [] }, "DeclinedRequest")
      );
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, "Internal server error"));
  }
});

export { getBusinessDeclinedRequests };
