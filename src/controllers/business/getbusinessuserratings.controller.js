import { Business } from "../../models/business.model.js";
import { Usersratings } from "../../models/rating.model.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import mongoose from "mongoose";

const getBusinessUserRatings = asyncHandler(async (req, res) => {
  const businessId = req.params.businessId;
  try {
    if (!businessId) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "BusinessID is not provided"));
    }
    const business = await Business.findOne({
      _id: new mongoose.Types.ObjectId(businessId),
    });
    if (!business) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Business not found"));
    }
    let usersRatings = await Usersratings.find({
      businessId: new mongoose.Types.ObjectId(businessId),
    })
      .populate("userId", "name") // Populate the name field from the User model
      .lean();

    // No need to map the userId and name properties
    return res
      .status(200)
      .json(
        new ApiResponse(200, { usersRatings }, "Ratings fetched successfully!")
      );
  } catch (error) {
    console.log(error);
    return res.status(500).json(new ApiResponse(500, "Internal Server Error"));
  }
});

export { getBusinessUserRatings };
