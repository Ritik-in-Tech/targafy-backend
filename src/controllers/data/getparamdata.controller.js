import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { Params } from "../../models/params.model.js";
import { Target } from "../../models/target.model.js";
import { DataAdd } from "../../models/dataadd.model.js";

import moment from "moment-timezone";

moment.tz.setDefault("Asia/Kolkata");

const GetParamData = asyncHandler(async (req, res) => {
  try {
    const businessId = req.params.businessId;
    const paramName = req.params.paramName;
    const monthValue = req.params.monthValue;
    if (!businessId || !paramName || !monthValue) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            {},
            "Business ID , parameter name and month value  are not provided"
          )
        );
    }

    const paramDetails = await Params.findOne({
      name: paramName,
      businessId: businessId,
    });
    if (!paramDetails) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            {},
            "Invalid parameter name and business ID provided"
          )
        );
    }

    const target = await Target.findOne({
      paramName: paramName,
      businessId: businessId,
    });
    if (!target) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            {},
            "Target is not set for this business and parameter"
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

    const startDate = moment.tz(
      `${year}-${month.toString().padStart(2, "0")}-01`,
      "Asia/Kolkata"
    );
    const endDate = startDate.clone().endOf("month");
    console.log("Start Date:", startDate.format("YYYY-MM-DD"));
    console.log("End Date:", endDate.format("YYYY-MM-DD"));

    const numUsersAssigned = target.usersAssigned.length;
    let targetValue = parseInt(target.targetValue);
    let dailyTargetValue = (targetValue * numUsersAssigned) / 30;
    dailyTargetValue = Math.floor(dailyTargetValue);

    const userDataList = await DataAdd.find(
      {
        businessId: businessId,
        parameterName: paramName,
        createdDate: {
          $gte: startDate.toDate(),
          $lte: endDate.toDate(),
        },
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
        const date = moment(item.createdDate)
          .tz("Asia/Kolkata")
          .format("YYYY-MM-DD");
        const todaysdata = parseFloat(item.todaysdata);
        if (!dateDataMap.has(date)) {
          dateDataMap.set(date, 0);
        }
        dateDataMap.set(date, dateDataMap.get(date) + todaysdata);
      });
    });

    console.log(dateDataMap);

    // Get the range of dates in the month based on user data
    const dates = Array.from(dateDataMap.keys()).sort();
    const firstDateStr = dates[0];

    // Parse the date string and create a Date object in IST
    const firstDate = moment.tz(firstDateStr, "Asia/Kolkata");

    // Calculate the first day of the month in IST
    const firstDayOfMonth = firstDate.clone().startOf("month");
    console.log("First day of month:", firstDayOfMonth.format("YYYY-MM-DD"));

    // Calculate the last day of the month in IST
    const lastDayOfMonth = firstDate.clone().endOf("month");
    console.log("Last day of month:", lastDayOfMonth.format("YYYY-MM-DD"));

    const lastUserDateStr = dates[dates.length - 1];
    const lastUserDate = moment.tz(lastUserDateStr, "Asia/Kolkata");
    console.log("Last User Date of data: ", lastUserDate);

    // Initialize the cumulative target array and user data array
    let accumulatedDailyTarget = 0;
    const cumulativeDailyTargets = [];
    let accumulatedData = 0;
    const formattedUserData = [];

    // Iterate through each day in the month
    for (
      let date = firstDayOfMonth.clone();
      date.isSameOrBefore(lastDayOfMonth);
      date.add(1, "days")
    ) {
      const formattedDate = date.format("YYYY-MM-DD");

      // Add daily target value
      accumulatedDailyTarget += dailyTargetValue;
      cumulativeDailyTargets.push([formattedDate, accumulatedDailyTarget]);

      // Check if the date is up to the last user date for data accumulation
      if (date.isSameOrBefore(lastUserDate)) {
        const dayData = dateDataMap.get(formattedDate) || 0;
        accumulatedData += dayData;
      }

      if (date.isSameOrBefore(lastUserDate)) {
        formattedUserData.push([formattedDate, accumulatedData]);
      }
    }

    const response = {
      userEntries: formattedUserData,
      dailyTargetAccumulated: cumulativeDailyTargets,
    };

    return res
      .status(200)
      .json(
        new ApiResponse(200, response, `${paramName} data fetched successfully`)
      );
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, "An error occurred while fetching data"));
  }
});

export { GetParamData };
