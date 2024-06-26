import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { Params } from "../../models/params.model.js";
import { Target } from "../../models/target.model.js";
import { DataAdd } from "../../models/dataadd.model.js";

import moment from "moment-timezone";

moment.tz.setDefault("Asia/Kolkata");

const GetParamDataSpecificUser = asyncHandler(async (req, res) => {
  try {
    const businessId = req.params.businessId;
    const paramName = req.params.paramName;
    const userId = req.params.userId;
    if (!businessId) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Business ID is not provided"));
    }

    if (!paramName || !userId) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            {},
            "Please provide param name and user id in body"
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
        .status(200)
        .json(new ApiResponse(200, { data: [] }, "Data not found"));
    }

    let targetValue = parseInt(target.targetValue);
    const dailyTargetValue = targetValue / 30;

    const userData = await DataAdd.findOne(
      {
        businessId: businessId,
        parameterName: paramName,
        userId: userId,
      },
      "data createdDate"
    );

    if (!userData || !userData.data || userData.data.length === 0) {
      return res
        .status(400)
        .json(
          new ApiResponse(400, {}, "No data found for the provided criteria")
        );
    }

    // Sort userData.data by createdDate
    userData.data.sort(
      (a, b) => new Date(a.createdDate) - new Date(b.createdDate)
    );

    const firstDataDate = moment(userData.data[0].createdDate).tz(
      "Asia/Kolkata"
    );
    console.log("FirstDataDate (IST):", firstDataDate.format());

    const firstDayOfMonth = firstDataDate.clone().startOf("month");
    console.log("firstDayOfMonth (IST):", firstDayOfMonth.format());

    const lastDayOfMonth = firstDataDate.clone().endOf("month");
    console.log("lastDayOfMonth (IST):", lastDayOfMonth.format());

    // Get the last date the user entered data
    const lastEnteredDate = moment(
      userData.data[userData.data.length - 1].createdDate
    ).tz("Asia/Kolkata");

    // Create a map to store user data by date
    const userDataMap = new Map();
    userData.data.forEach((item) => {
      const date = moment(item.createdDate).tz("Asia/Kolkata");
      const formattedDate = date.format("YYYY-MM-DD");
      userDataMap.set(formattedDate, parseFloat(item.todaysdata));
    });

    console.log(userDataMap);

    let accumulatedData = 0;
    const formattedUserData = [];
    const dailyTargetEntries = [];

    // Iterate through all days of the month
    for (
      let d = firstDayOfMonth.clone();
      d.isSameOrBefore(lastDayOfMonth);
      d.add(1, "days")
    ) {
      const formattedDate = d.format("YYYY-MM-DD");

      // Only add user data up to the last entered date
      if (d.isSameOrBefore(lastEnteredDate)) {
        const dayData = userDataMap.get(formattedDate) || 0;
        accumulatedData += dayData;
        formattedUserData.push([formattedDate, accumulatedData]);
      }

      // Always add daily target for the entire month
      dailyTargetEntries.push([formattedDate, dailyTargetValue * d.date()]);
    }

    const response = {
      userEntries: formattedUserData,
      dailyTarget: dailyTargetEntries,
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

export { GetParamDataSpecificUser };
