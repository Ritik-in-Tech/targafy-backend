import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { User } from "../../models/user.model.js";
import { Business } from "../../models/business.model.js";
import { Businessusers } from "../../models/businessUsers.model.js";
import { Target } from "../../models/target.model.js";
import { DataAdd } from "../../models/dataadd.model.js";
import moment from "moment-timezone";
import { GetTargetAssignedUsers } from "../../utils/helpers/gettargetassignedusers.js";
moment.tz.setDefault("Asia/Kolkata");

const getLevelDataController = asyncHandler(async (req, res) => {
  try {
    const { userId, businessId, paramName, monthValue } = req.params;

    if (!userId || !businessId || !paramName || !monthValue) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            {},
            "Please provide businessId, userId, paramName, and monthValue in params"
          )
        );
    }

    // Validate and parse month name and year
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

    // Check if the allSubordinates field exists and is an array
    if (!Array.isArray(businessuser.allSubordinates)) {
      console.log(
        "allSubordinates field is not an array or does not exist:",
        businessuser.allSubordinates
      );
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

    // Check the structure of allSubordinates and map the IDs properly
    console.log(
      "allSubordinates before mapping:",
      businessuser.allSubordinates
    );
    const allSubordinates = businessuser.allSubordinates
      .map((sub) => {
        if (sub && sub._id) {
          return sub._id.toString();
        } else if (sub) {
          return sub.toString();
        }
        return undefined;
      })
      .filter(Boolean); // Filter out undefined values

    console.log("allSubordinates after mapping:", allSubordinates);
    let userIds = [...allSubordinates];
    if (userIds.length === 0) {
      userIds = [userId];
    }
    console.log("Combined userIds:", userIds);

    const target = await Target.findOne({
      paramName: paramName,
      businessId: businessId,
      monthIndex: monthValue,
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

    const lastDayOfMonth1 = endDate.date();
    const dailyTargetValue = await GetTargetAssignedUsers(
      paramName,
      monthValue,
      businessId,
      lastDayOfMonth1,
      userIds
    );
    console.log("hello");

    console.log(dailyTargetValue);

    // const numUsersAssigned = userIds.length;
    // console.log(numUsersAssigned);
    // let targetValue = parseInt(target.targetValue); // 2000*9
    // let dailyTargetValue =
    //   (targetValue * numUsersAssigned) / startDate.daysInMonth();
    // dailyTargetValue = Math.floor(dailyTargetValue);

    const userDataList = await DataAdd.find(
      {
        businessId: businessId,
        parameterName: paramName,
        userId: { $in: userIds },
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
    let totalTargetAchieved = 0;
    let actualTotalTarget = 0;

    // Iterate through each day in the specified month
    for (
      let date = startDate.clone();
      date.isSameOrBefore(endDate);
      date.add(1, "days")
    ) {
      const formattedDate = date.format("YYYY-MM-DD");

      // Add daily target value
      accumulatedDailyTarget += dailyTargetValue;
      actualTotalTarget += dailyTargetValue;
      cumulativeDailyTargets.push([formattedDate, accumulatedDailyTarget]);

      // Check if the date has data and add to the accumulated data
      if (date.isSameOrBefore(lastUserDate)) {
        const dayData = dateDataMap.get(formattedDate) || 0;
        accumulatedData += dayData;
        totalTargetAchieved += dayData;
      }

      if (date.isSameOrBefore(lastUserDate)) {
        formattedUserData.push([formattedDate, accumulatedData]);
      }
    }

    const data = {
      userEntries: formattedUserData,
      dailyTargetAccumulated: cumulativeDailyTargets,
    };

    let percentage;
    percentage = (totalTargetAchieved / actualTotalTarget) * 100;
    percentage = Math.floor(percentage);

    const benchmarkValues = target.benchMark
      ? target.benchMark.map((benchmark) => benchmark.value)
      : [];

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          data,
          totalTargetAchieved,
          actualTotalTarget,
          percentage,
          benchmarkValues,
        },
        `${user.name} and below data fetched successfully`
      )
    );
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json(new ApiResponse(500, { error }, "Internal server error"));
  }
});

export { getLevelDataController };
