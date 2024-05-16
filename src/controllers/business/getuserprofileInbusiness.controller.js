import { Businessusers } from "../../models/businessUsers.model.js";
import { Usersratings } from "../../models/rating.model.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

const getUserProfileInBusiness = asyncHandler(async (req, res, next) => {
  try {
    const userId = req?.params?.userId;
    const businessId = req?.params?.businessId;

    if (!businessId || !userId) {
      return next(new ApiError(`provide businessId and userId`, 404));
    }

    const result = await Businessusers.findOne({
      businessId: businessId,
      userId: userId,
    }).select(
      "-__v -subordinates -allSubordinates -groupsJoined -activityViewCounter"
    );

    if (!result) {
      return res
        .status(404)
        .json(new ApiResponse(404, {}, "User not present in business"));
    }

    const rating =
      (await Usersratings.find({
        businessId: businessId,
        userId: userId,
      }).lean()) || [];

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { user: { ...result._doc, rating: rating } },
          "User details fetched successfully"
        )
      );
  } catch (error) {
    return res
      .status(500)
      .json(new ApiResponse(500, {}, "Internal server error"));
  }
});

export { getUserProfileInBusiness };
