import { asyncHandler } from "../../utils/asyncHandler.js";
import { Params } from "../../models/params.model.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { Target } from "../../models/target.model.js";
import { Group } from "../../models/group.model.js";
import { DataAdd } from "../../models/dataadd.model.js";

const getSubGroupDataLevel = asyncHandler(async (req, res) => {
  try {
    const groupId = req.params.groupId;
    const paramName = req.body.paramName;
    const loggedInUser = req.user._id;
    if (!loggedInUser) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Invalid token please log in again"));
    }
    if (!groupId || !paramName) {
      return res
        .status(400)
        .json(
          new ApiResponse(400, {}, "groupId and param name is not provided")
        );
    }
    const groupDetails = await Group.findById(groupId);
    if (!groupDetails) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Invalid group Id provided"));
    }

    const target = await Target.findOne({
      paramName: paramName,
      businessId: groupDetails.businessId,
    });
    if (!target) {
      return res
        .status(200)
        .json(new ApiResponse(200, { data: [] }, "No data found"));
    }

    const numUsersAssigned = groupDetails.userAdded.length;
    console.log(numUsersAssigned);
    let targetValue = parseInt(target.targetValue);
    const totalTargetValue = targetValue * numUsersAssigned;
    const dailyTargetValue = totalTargetValue / 30;

    const userIds = groupDetails.userAdded.map((user) => user.userId);

    const userDataList = await DataAdd.find(
      {
        businessId: groupDetails.businessId,
        parameterName: paramName,
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
          `${groupDetails.groupName} data fetched successfully`
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
