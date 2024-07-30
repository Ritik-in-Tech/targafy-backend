import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { User } from "../../models/user.model.js";
import { Business } from "../../models/business.model.js";
import { Businessusers } from "../../models/businessUsers.model.js";
import moment from "moment-timezone";
import { Group } from "../../models/group.model.js";
moment.tz.setDefault("Asia/Kolkata");

export const getGroupPieChartData = asyncHandler(async (req, res) => {
  try {
    const { groupId, businessId, paramName, monthValue } = req.params;

    if (!groupId || !businessId || !paramName || !monthValue) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            {},
            "Please provide businessId, groupId, paramName and month value in params"
          )
        );
    }

    const year = moment().year();
    const month = parseInt(monthValue, 10);

    if (isNaN(month) || month < 1 || month > 12) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            {},
            "Invalid month value provided. Must be between 1 and 12"
          )
        );
    }

    const business = await Business.findById(businessId);
    if (!business) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Business not found"));
    }

    const groupDetail = await Group.findById(groupId);
    if (!groupDetail) {
      return res.status(400).json(new ApiResponse(400, {}, "Group not found"));
    }

    if (groupDetail.businessId.toString() !== business._id.toString()) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Group not in the provided businessId"));
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
    let SubordinateGroupId;
    if (
      groupDetail.subordinateGroups &&
      groupDetail.subordinateGroups.length > 0
    ) {
      SubordinateGroupId = groupDetail.subordinateGroups.map(
        (group) => group.subordinateGroupId
      );
    }

    console.log(SubordinateGroupId);

    const userDataMap = new Map();
    let totalSum = 0;

    for (const subordinateId of SubordinateGroupId) {
      let newUserIds;
      const subOrdinateGroupDetail = await Group.findById(subordinateId);
      subOrdinateGroupDetail.forEach((subGroup) => {
        if (subGroup.userAdded) {
          newUserIds = userIds.concat(
            subGroup.userAdded.map((user) => user.userId.toString())
          );
        }
      });

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

      userDataMap.set(subOrdinateGroupDetail.groupName, sumData);
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
