import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { User } from "../../models/user.model.js";
import { Business } from "../../models/business.model.js";
import { Businessusers } from "../../models/businessUsers.model.js";
import { Target } from "../../models/target.model.js";
import { DataAdd } from "../../models/dataadd.model.js";
import moment from "moment-timezone";
moment.tz.setDefault("Asia/Kolkata");

const getPieChartData = asyncHandler(async (req, res) => {
  try {
    const userId = req.params.userId;
    const businessId = req.params.businessId;
    const paramName = req.params.paramName;

    if (!userId || !businessId || !paramName) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            {},
            "Please provide businessId, userId, and paramName in params"
          )
        );
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(400).json(new ApiResponse(400, {}, "User not found"));
    }
    const business = await Business.findById(businessId);
    if (!business) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Business not found"));
    }

    const businessuser = await Businessusers.findOne({
      businessId: businessId,
      userId: userId,
    });

    if (!businessuser) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            {},
            "Provided user is not associated with the business"
          )
        );
    }

    if (!Array.isArray(businessuser.subordinates)) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            {},
            "No subordinates found for the provided user"
          )
        );
    }

    const Subordinates = businessuser.subordinates
      .map((sub) =>
        sub && sub._id ? sub._id.toString() : sub ? sub.toString() : undefined
      )
      .filter(Boolean);

    const userDataMap = new Map();
    let totalSum = 0;

    for (const userIds of Subordinates) {
      const user = await User.findById(userIds);
      if (!user) {
        console.log(`User not found for ID: ${userIds}`);
        continue;
      }
      const userName = user.name;

      const businessuser = await Businessusers.findOne({
        businessId: businessId,
        userId: userIds,
      });

      if (!businessuser) {
        console.log(`Business user not found for userId: ${userIds}`);
        continue;
      }

      if (!Array.isArray(businessuser.allSubordinates)) {
        console.log(`No subordinates found for user: ${userIds}`);
        continue;
      }

      const allSubordinates = businessuser.allSubordinates
        .map((sub) =>
          sub && sub._id ? sub._id.toString() : sub ? sub.toString() : undefined
        )
        .filter(Boolean);

      const newUserIds = [userIds, ...allSubordinates];

      let sumData = 0;
      for (const newUserId of newUserIds) {
        const user = await User.findById(newUserId);
        if (user && user.data && user.data[0]) {
          const userdata = user.data[0].targetDone || 0;
          sumData += userdata;
        }
      }

      userDataMap.set(userName, {
        data: sumData,
      });

      totalSum += sumData;
      userDataMap.set(user.name, sumData);
    }

    const percentageData = Array.from(userDataMap).map(([name, value]) => {
      const percentage = totalSum > 0 ? (value / totalSum) * 100 : 0;
      return {
        name,
        value,
        percentage: parseFloat(percentage.toFixed(2)),
      };
    });

    percentageData.sort((a, b) => b.percentage - a.percentage);

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          totalSum,
          userData: percentageData,
        },
        "Data retrieved successfully"
      )
    );
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json(new ApiResponse(500, { error }, "Internal server error"));
  }
});
export { getPieChartData };
