import { asyncHandler } from "../../utils/asyncHandler";
import { ApiResponse } from "../../utils/ApiResponse";
import { Business } from "../../models/business.model";
import { Businessusers } from "../../models/businessUsers.model";
import { User } from "../../models/user.model";
import { Target } from "../../models/target.model";
const getThreeMonthsDataUser = asyncHandler(async (req, res) => {
  try {
    const { userId, targetId, businessId } = req.params;
    if (!userId || !targetId || !businessId) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            {},
            "Please provide targetId and userId in params"
          )
        );
    }

    const loggedInUserId = req.user._id;
    if (!loggedInUserId) {
      return res.status(400).json(new ApiResponse(400, {}, "Token Invalid"));
    }

    const loggedInUser = await User.findById(loggedInUserId);
    if (!loggedInUser) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Admin or Mini Admin not found"));
    }

    const business = await Business.findById(businessId);
    if (!business) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Business does not exist"));
    }

    const businessusers = await Businessusers.findOne({
      businessId: businessId,
      userId: loggedInUserId,
    });

    if (!businessusers) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            {},
            "logged in user is not associated with the business"
          )
        );
    }

    if (businessusers.role === "User") {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            {},
            "Only admin and miniAdmin is allowed to do this"
          )
        );
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(400).json(new ApiResponse(400, {}, "User not found"));
    }

    const businessUser = await Businessusers.findOne({
      businessId: businessId,
      userId: userId,
    });

    if (!businessUser) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            {},
            "User is not associated with the provided business Id"
          )
        );
    }

    const target = await Target.findById(targetId);
    if (!target) {
      return res.status(400).json(new ApiResponse(400, {}, "target not found"));
    }

    

  } catch (error) {}
});
