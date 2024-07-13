import { Business } from "../../models/business.model.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { Target } from "../../models/target.model.js";
import moment from "moment-timezone";
moment.tz.setDefault("Asia/Kolkata");

const getTargetToAddData = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    if (!userId) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Invalid Token, please log in again"));
    }

    const businessId = req.params.businessId;
    if (!businessId) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Business id is not provided"));
    }

    const business = await Business.findById(businessId);
    if (!business) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            {},
            "Business not exist with the provided business Id"
          )
        );
    }

    let monthIndex = moment().month() + 1;
    monthIndex = monthIndex.toString();

    const targets = await Target.find({
      businessId: businessId,
      userId: userId,
      monthIndex: monthIndex,
    });

    if (!targets || targets.length === 0) {
      return res
        .status(404)
        .json(
          new ApiResponse(
            404,
            {},
            "No targets found for the provided business Id"
          )
        );
    }

    // Extract unique paramNames
    const uniqueParamNames = [
      ...new Set(targets.map((target) => target.paramName)),
    ];

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { paramNames: uniqueParamNames },
          "Target param names fetched successfully"
        )
      );
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json(
        new ApiResponse(500, {}, "An error occurred while fetching targets")
      );
  }
});

const getTargetToAddDataNew = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    if (!userId) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Invalid Token, please log in again"));
    }

    const businessId = req.params.businessId;
    if (!businessId) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Business id is not provided"));
    }

    const business = await Business.findById(businessId);
    if (!business) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            {},
            "Business not exist with the provided business Id"
          )
        );
    }

    let monthIndex = moment().month() + 1;
    monthIndex = monthIndex.toString();

    const targets = await Target.find({
      businessId: businessId,
      userId: userId,
      monthIndex: monthIndex,
    });

    if (!targets || targets.length === 0) {
      return res
        .status(404)
        .json(
          new ApiResponse(
            404,
            {},
            "No targets found for the provided business Id"
          )
        );
    }

    const daysInMonth = moment().daysInMonth();

    const paramTargets = targets.reduce((acc, target) => {
      const dailyTargetValue = parseFloat(target.targetValue) / daysInMonth;
      const halfDailyTarget = dailyTargetValue / 2;

      const minValue = Math.max(0, dailyTargetValue - halfDailyTarget);
      const maxValue = dailyTargetValue + halfDailyTarget;

      acc[target.paramName] = {
        min: minValue.toFixed(2),
        max: maxValue.toFixed(2),
        daily: dailyTargetValue.toFixed(2),
      };
      return acc;
    }, {});

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { paramTargets },
          "Target param names and daily value ranges fetched successfully"
        )
      );
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json(
        new ApiResponse(500, {}, "An error occurred while fetching targets")
      );
  }
});

export { getTargetToAddData, getTargetToAddDataNew };
