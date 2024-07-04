import { Target } from "../../models/target.model.js";
import { ApiResponse } from "../ApiResponse.js";
import { asyncHandler } from "../asyncHandler.js";

export const GetTargetAssignedUsers = async (
  paramName,
  monthValue,
  businessId,
  lastDayOfMonth,
  userIds
) => {
  try {
    // Validate required fields
    if (!paramName || !monthValue || !businessId || !lastDayOfMonth) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Please provide all required fields"));
    }

    // Fetch targets based on given criteria
    const totalTargets = await Target.find({
      paramName: paramName,
      businessId: businessId,
      monthIndex: monthValue,
      userId: { $in: userIds },
    });

    console.log(totalTargets);

    // Check if any targets were found
    if (!totalTargets || totalTargets.length === 0) {
      return res
        .status(404)
        .json(new ApiResponse(404, {}, "Total Target not found"));
    }

    const sumTarget = totalTargets.reduce((sum, target) => {
      return sum + Number(target.targetValue);
    }, 0);

    let dailyTarget = sumTarget / lastDayOfMonth;
    dailyTarget = Math.floor(dailyTarget);

    return dailyTarget;
  } catch (error) {
    console.error("Error:", error);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, "Internal Server Error"));
  }
};
