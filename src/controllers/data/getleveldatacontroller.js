import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { User } from "../../models/user.model.js";
import { Business } from "../../models/business.model.js";
import { Businessusers } from "../../models/businessUsers.model.js";
import { Target } from "../../models/target.model.js";
import { DataAdd } from "../../models/dataadd.model.js";
import moment from "moment-timezone";
moment.tz.setDefault("Asia/Kolkata");

const getLevelDataController = asyncHandler(async (req, res) => {
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
    const userIds = [userId, ...allSubordinates];
    console.log("Combined userIds:", userIds);

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

    const numUsersAssigned = target.usersAssigned.length;
    let targetValue = parseInt(target.targetValue);
    const dailyTargetValue = (targetValue * numUsersAssigned) / 30;

    const userDataList = await DataAdd.find(
      {
        businessId: businessId,
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
        new ApiResponse(
          200,
          response,
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
