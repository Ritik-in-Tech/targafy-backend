import { DataAdd } from "../../models/dataadd.model.js";
import { Params } from "../../models/params.model.js";
import { Target } from "../../models/target.model.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

const getMainGroupData = asyncHandler(async (req, res) => {
  try {
    const paramsId = req.params.paramId;
    const businessId = req.params.businessId;
    const loggedInUser = req.user._id;
    if (!loggedInUser) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Invalid token please log in again"));
    }
    if (!paramsId || !businessId) {
      return res
        .status(400)
        .json(
          new ApiResponse(400, {}, "paramsId and business Id is not provided")
        );
    }
    const paramDetails = await Params.findById(paramsId);
    if (!paramDetails) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Invalid param Id is provided"));
    }
    const target = await Target.findOne({
      paramName: paramDetails.name,
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

    const numUsersAssigned = paramDetails.usersAssigned.length;
    console.log(numUsersAssigned);
    let targetValue = parseInt(target.targetValue);
    const totalTargetValue = targetValue * numUsersAssigned;
    console.log(totalTargetValue);
    const dailyTargetValue = totalTargetValue / 30;
    console.log(dailyTargetValue);

    const userIds = paramDetails.usersAssigned.map((user) => user.userId);

    const userDataList = await DataAdd.find(
      {
        businessId: businessId,
        parameterName: paramDetails.name,
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

    const dateDataMap = new Map();

    userDataList.forEach((userData) => {
      userData.data.forEach((item) => {
        const dateObj = new Date(item.createdDate);
        const date = dateObj.toISOString().split("T")[0];
        const todaysdata = parseFloat(item.todaysdata);
        if (!dateDataMap.has(date)) {
          dateDataMap.set(date, 0);
        }
        dateDataMap.set(date, dateDataMap.get(date) + todaysdata);
      });
    });

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
          `${paramDetails.name} data fetched successfully`
        )
      );
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, "An error occurred while fetching data"));
  }
});

export { getMainGroupData };
