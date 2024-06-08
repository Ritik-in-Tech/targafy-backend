import { asyncHandler } from "../../utils/asyncHandler.js";
import { Params } from "../../models/params.model.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { Target } from "../../models/target.model.js";
import { Group } from "../../models/group.model.js";
import { DataAdd } from "../../models/dataadd.model.js";

const getSubGroupDataLevel = asyncHandler(async (req, res) => {
  try {
    const parentGroupId = req.params.parentGroupId;
    const businessId = req.params.businessId;
    const loggedInUser = req.user._id;
    if (!loggedInUser) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Invalid token please log in again"));
    }
    if (!parentGroupId || !businessId) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            {},
            "ParentGroup Id and business Id is not provided"
          )
        );
    }
    const leveluptoDataWants = req.body.groupName;
    if (!leveluptoDataWants) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "group name not given"));
    }

    const parentGroupDetails = await Group.findById(parentGroupId);
    if (!parentGroupDetails) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Invalid group Id provided"));
    }

    const target = await Target.findOne({
      paramName: parentGroupDetails.groupName,
      businessId: businessId,
    });
    if (!target) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            {},
            "Target is not set for this business and group name"
          )
        );
    }

    const levelDetails = await Group.findOne({
      businessId: businessId,
      groupName: leveluptoDataWants,
      parentGroupId: parentGroupId,
    });

    console.log(levelDetails);

    if (!levelDetails) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            {},
            "Level for the provided group name in this business does not exist!"
          )
        );
    }

    const numUsersAssigned = levelDetails.userAdded.length;
    console.log(numUsersAssigned);
    let targetValue = parseInt(target.targetValue);
    const totalTargetValue = targetValue * numUsersAssigned;
    const dailyTargetValue = totalTargetValue / 30;

    const userIds = levelDetails.userAdded.map((user) => user.userId);

    const userDataList = await DataAdd.find(
      {
        businessId: businessId,
        parameterName: parentGroupDetails.groupName,
        userId: { $in: userIds },
      },
      "data createdDate"
    );

    if (!userDataList || userDataList.length === 0) {
      return res
        .status(400)
        .json(
          new ApiResponse(400, {}, "No data found for the provided criteria")
        );
    }

    // Create a map to store the cumulative sum of `todaysdata` for each `createdDate`
    const dateDataMap = new Map();

    // Iterate over each user's data and sum the values for each date
    userDataList.forEach((userData) => {
      userData.data.forEach((item) => {
        const dateObj = new Date(item.createdDate);
        const date = dateObj.toISOString().split("T")[0]; // Get only the date part
        const todaysdata = parseFloat(item.todaysdata);
        if (!dateDataMap.has(date)) {
          dateDataMap.set(date, 0);
        }
        dateDataMap.set(date, dateDataMap.get(date) + todaysdata);
      });
    });

    // Convert the dateDataMap to a cumulative formatted array
    let accumulatedData = 0;
    const formattedUserData = Array.from(dateDataMap.entries()).map(
      ([date, sum]) => {
        accumulatedData += sum;
        return [date, accumulatedData];
      }
    );

    let accumulatedTarget = 0;
    const dailyTargetEntries = formattedUserData.map(([date], index) => {
      accumulatedTarget += dailyTargetValue;
      return [date, accumulatedTarget];
    });

    const response = {
      userEntries: formattedUserData,
      dailyTarget: dailyTargetEntries,
    };

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          response,
          `${leveluptoDataWants} data fetched successfully`
        )
      );
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, "An error occurred while fetching data"));
  }
});

export { getSubGroupDataLevel };
