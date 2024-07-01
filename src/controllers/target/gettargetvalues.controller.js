import { asyncHandler } from "../../utils/asyncHandler.js";
import { Target } from "../../models/target.model.js";
import { Business } from "../../models/business.model.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

const getTargetValues = asyncHandler(async (req, res) => {
  try {
    const businessId = req.params.businessId;
    const business = await Business.findById(businessId);

    if (!business) {
      return res
        .status(404)
        .json(new ApiResponse(404, {}, "Business not found"));
    }

    const targets = await Target.find({ businessId: businessId });

    // if (!targets || targets.length === 0) {
    //   return res
    //     .status(404)
    //     .json(
    //       new ApiResponse(
    //         404,
    //         {},
    //         "No targets found for the provided business Id"
    //       )
    //     );
    // }

    const targetValues = targets.map((target) => {
      const targetValueNumber = parseFloat(target.targetValue);
      const numberOfUsersAssigned = target.usersAssigned.length;
      const totalTargetValue = targetValueNumber * numberOfUsersAssigned;
      return {
        targetId: target._id,
        targetName: target.paramName,
        totalTargetValue: totalTargetValue,
        userAssigned: target.usersAssigned.map((user) => ({
          name: user.name,
          userId: user.userId,
        })),
      };
    });

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          targetValues,
          "Target values retrieved successfully"
        )
      );
  } catch (error) {
    console.error("Error:", error);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, "Internal Server Error"));
  }
});

export { getTargetValues };
