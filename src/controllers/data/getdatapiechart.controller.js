import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { User } from "../../models/user.model.js";
import { Business } from "../../models/business.model.js";
import { Businessusers } from "../../models/businessUsers.model.js";
import moment from "moment-timezone";
moment.tz.setDefault("Asia/Kolkata");

const getPieChartData = asyncHandler(async (req, res) => {
  try {
    const { userId, businessId, paramName, monthValue } = req.params;

    if (!userId || !businessId || !paramName || !monthValue) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            {},
            "Please provide businessId, userId, paramName and month value in params"
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

    // Extract target done value for the specific user, parameter, and month
    const targetMonth = moment()
      .month(parseInt(monthValue) - 1)
      .startOf("month");
    // const userTargetDone = user.data.find(
    //   (item) =>
    //     item.name === paramName &&
    //     moment(item.createdDate).isSame(targetMonth, "month")
    // );

    // if (!userTargetDone) {
    //   return res
    //     .status(400)
    //     .json(
    //       new ApiResponse(
    //         400,
    //         {},
    //         `No data found for user ${user.name} for parameter ${paramName} in the specified month`
    //       )
    //     );
    // }

    // const userTargetDoneValue = userTargetDone.targetDone;

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

    for (const subordinateId of Subordinates) {
      const subordinate = await User.findById(subordinateId);
      if (!subordinate) {
        console.log(`User not found for ID: ${subordinateId}`);
        continue;
      }

      const subordinateBusinessuser = await Businessusers.findOne({
        businessId: businessId,
        userId: subordinateId,
      });

      if (!subordinateBusinessuser) {
        console.log(`Business user not found for userId: ${subordinateId}`);
        continue;
      }

      if (!Array.isArray(subordinateBusinessuser.allSubordinates)) {
        console.log(`No subordinates found for user: ${subordinateId}`);
        continue;
      }

      const allSubordinates = subordinateBusinessuser.allSubordinates
        .map((sub) =>
          sub && sub._id ? sub._id.toString() : sub ? sub.toString() : undefined
        )
        .filter(Boolean);

      const newUserIds = [subordinateId, ...allSubordinates];

      let sumData = 0;
      for (const newUserId of newUserIds) {
        const subUser = await User.findById(newUserId);
        if (subUser && subUser.data) {
          const subUserData = subUser.data.find(
            (item) =>
              item.name === paramName &&
              moment(item.createdDate).isSame(targetMonth, "month")
          );
          if (subUserData) {
            sumData += subUserData.targetDone;
          }
        }
      }

      userDataMap.set(subordinate.name, sumData);
      totalSum += sumData;
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
