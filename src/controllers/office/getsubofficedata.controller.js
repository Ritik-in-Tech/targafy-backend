import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { Target } from "../../models/target.model.js";
import { DataAdd } from "../../models/dataadd.model.js";
import { Office } from "../../models/office.model.js";

const getSubOfficeDataLevel = asyncHandler(async (req, res) => {
  try {
    const officeId = req.params.officeId;
    const paramName = req.params.paramName;
    const loggedInUser = req.user._id;
    if (!loggedInUser) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Invalid token please log in again"));
    }
    if (!officeId || !paramName) {
      return res
        .status(400)
        .json(
          new ApiResponse(400, {}, "officeId and param name is not provided")
        );
    }
    const officeDetails = await Office.findById(officeId);
    if (!officeDetails) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Invalid office Id provided"));
    }

    const target = await Target.findOne({
      paramName: paramName,
      businessId: officeDetails.businessId,
    });
    if (!target) {
      return res
        .status(200)
        .json(new ApiResponse(200, { data: [] }, "No data found"));
    }

    const numUsersAssigned = officeDetails.userAdded.length;
    console.log(numUsersAssigned);
    let targetValue = parseInt(target.targetValue);
    const totalTargetValue = targetValue * numUsersAssigned;
    const dailyTargetValue = totalTargetValue / 30;

    const userIds = officeDetails.userAdded.map((user) => user.userId);

    const userDataList = await DataAdd.find(
      {
        businessId: officeDetails.businessId,
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

    // Get the range of dates in the month based on user data
    const dates = Array.from(dateDataMap.keys()).sort();
    const firstDateStr = dates[0];

    // Parse the date string and create a Date object in UTC
    const firstDate = new Date(firstDateStr + "T00:00:00Z");

    // Calculate the first day of the month
    const firstDayOfMonth = new Date(
      Date.UTC(firstDate.getUTCFullYear(), firstDate.getUTCMonth(), 1)
    );

    // Calculate the last day of the month
    const lastDayOfMonth = new Date(
      Date.UTC(firstDate.getUTCFullYear(), firstDate.getUTCMonth() + 1, 0)
    );

    console.log(
      "First day of month:",
      firstDayOfMonth.toISOString().split("T")[0]
    );
    console.log(
      "Last day of month:",
      lastDayOfMonth.toISOString().split("T")[0]
    );

    // Calculate the cumulative daily target values
    let accumulatedDailyTarget = 0;
    const cumulativeDailyTargets = [];
    for (
      let date = new Date(firstDayOfMonth);
      date <= lastDayOfMonth;
      date.setUTCDate(date.getUTCDate() + 1)
    ) {
      accumulatedDailyTarget += dailyTargetValue;
      cumulativeDailyTargets.push([
        date.toISOString().split("T")[0],
        accumulatedDailyTarget,
      ]);
    }

    // Convert the dateDataMap to a cumulative formatted array
    let accumulatedData = 0;
    const formattedUserData = Array.from(dateDataMap.entries()).map(
      ([date, sum]) => {
        accumulatedData += sum;
        return [date, accumulatedData];
      }
    );

    const response = {
      userEntries: formattedUserData,
      dailyTargetAccumulated: cumulativeDailyTargets,
    };

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          response,
          `${officeDetails.officeName} data fetched successfully`
        )
      );
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, "An error occurred while fetching data"));
  }
});

export { getSubOfficeDataLevel };
