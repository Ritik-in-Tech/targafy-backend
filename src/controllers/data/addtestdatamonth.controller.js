import { Business } from "../../models/business.model.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { Params } from "../../models/params.model.js";
import { Target } from "../../models/target.model.js";
import { DataAdd } from "../../models/dataadd.model.js";
import mongoose from "mongoose";
import { User } from "../../models/user.model.js";
import { Activites } from "../../models/activities.model.js";
import moment from "moment-timezone";
import { generateRandomNumber } from "../../utils/helpers/generaterandomnumber.js";
moment.tz.setDefault("Asia/Kolkata");

const formatDate = (date) => date.format("YYYY-MM-DD");

const AddTestDataForMonth = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { parameterName, businessId, monthName } = req.params;
    const userId = req.user._id;

    if (!userId) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(401)
        .json(new ApiResponse(401, {}, "Token expired, please log in again"));
    }

    // Validate presence of required params
    if (!parameterName || !businessId || !monthName) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            {},
            "Missing parameterName, businessId, or monthName in params"
          )
        );
    }

    // Validate user, business, and parameter
    const user = await User.findById(userId).session(session);
    if (!user) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json(new ApiResponse(404, {}, "User not found"));
    }

    const business = await Business.findById(businessId).session(session);
    if (!business) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(404)
        .json(new ApiResponse(404, {}, "Business not found"));
    }

    const paramDetails = await Params.findOne({
      name: parameterName,
      businessId,
    }).session(session);
    if (!paramDetails) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json(new ApiResponse(404, {}, "Param not found"));
    }

    const target = await Target.findOne({
      paramName: parameterName,
      businessId,
    }).session(session);
    if (!target) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json(new ApiResponse(404, {}, "Target not found"));
    }

    let targetValue = target.targetValue;
    targetValue = parseInt(targetValue);

    const userAssigned = target.usersAssigned.some((user) =>
      user.userId.equals(userId)
    );
    if (!userAssigned) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(403)
        .json(
          new ApiResponse(403, {}, "User is not assigned to this parameter")
        );
    }

    const currentYear = moment().year();
    const monthStart = moment()
      .year(currentYear)
      .month(monthName)
      .startOf("month");
    const monthEnd = monthStart.clone().endOf("month");

    if (!monthStart.isValid()) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Invalid month name provided"));
    }

    const allDays = [];

    let currentDate = monthStart.clone();
    while (currentDate.isSameOrBefore(monthEnd)) {
      allDays.push(currentDate.clone());
      currentDate.add(1, "day");
    }

    const totalDays = allDays.length;

    console.log("First day of the month:", formatDate(allDays[0]));
    console.log(
      "Last day of the month:",
      formatDate(allDays[allDays.length - 1])
    );
    console.log(monthStart.month() + 1);

    let dataAdd = await DataAdd.findOne({
      parameterName,
      userId,
      businessId,
      $expr: {
        $and: [
          { $eq: [{ $month: "$createdDate" }, monthStart.month() + 1] },
          { $eq: [{ $year: "$createdDate" }, currentYear] },
        ],
      },
    }).session(session);

    // const formattedDate = formatDate(allDays[allDays.length - 1]);
    // const todaysdata = generateRandomData().toString();
    // const comment = `Data for ${formattedDate}`;

    // console.log(formattedDate);
    // console.log(todaysdata);
    // console.log(comment);
    const adjustedDate = allDays[0]
      .clone()
      .hour(12)
      .minute(0)
      .second(0)
      .millisecond(0)
      .utc()
      .toDate();
    console.log(adjustedDate);
    const currentMonth = allDays[0].month() + 1;
    console.log(currentMonth);
    if (!dataAdd) {
      console.log("Data added not found");
      dataAdd = new DataAdd({
        parameterName,
        userId,
        addedBy: user.name,
        monthIndex: currentMonth,
        businessId,
        data: [],
        createdDate: adjustedDate,
      });
    }
    // console.log("Hello world");
    // console.log(adjustedDate.getMonth());
    // console.log(adjustedDate.getFullYear());

    for (const day of allDays) {
      const formattedDate = formatDate(day);
      const todaysdata = generateRandomNumber(targetValue, totalDays);
      const comment = `Data for ${formattedDate}`;

      // Create a new Date object at noon IST, which is 6:30 UTC
      const adjustedDate = day
        .clone()
        .hour(12)
        .minute(0)
        .second(0)
        .millisecond(0)
        .utc()
        .toDate();

      console.log(adjustedDate);

      dataAdd.data.push({
        todaysdata,
        comment,
        createdDate: adjustedDate,
      });

      await dataAdd.save({ session });

      console.log("Hello");
      console.log(dataAdd._id);

      const activity = new Activites({
        userId: userId,
        businessId,
        content: `${user.name} added the data for ${parameterName} on ${formattedDate}`,
        activityCategory: "Data Add",
      });

      await activity.save({ session });

      // const targetValue = parseFloat(target.targetValue);
      const todaysDataValue = parseFloat(todaysdata);

      const currentMonth = day.month() + 1;

      let userDataEntry = user.data.find(
        (entry) =>
          entry.name === parameterName &&
          entry.dataId.equals(dataAdd._id) &&
          entry.createdDate.getMonth() + 1 === currentMonth &&
          entry.createdDate.getFullYear() === currentYear
      );

      if (userDataEntry) {
        console.log("Found");
        userDataEntry.targetDone += todaysDataValue;
      } else {
        console.log("Not Found");
        user.data.push({
          name: parameterName,
          dataId: dataAdd._id,
          targetDone: todaysDataValue,
          createdDate: adjustedDate,
        });
        await user.save({ session });
      }

      // Sort the data array to keep the most recent entries first
      user.data.sort((a, b) => b.createdDate - a.createdDate);

      // // Optionally, limit the number of entries to keep (e.g., last 12 months)
      // const MAX_ENTRIES = 12;
      // if (user.data.length > MAX_ENTRIES) {
      //   user.data = user.data.slice(0, MAX_ENTRIES);
      // }

      await user.save({ session });
    }

    await dataAdd.save({ session });
    await user.save({ session });
    console.log(
      "Data to be saved:",
      dataAdd.data.map((d) => ({
        date: d.createdDate,
        formatted: moment(d.createdDate)
          .tz("Asia/Kolkata")
          .format("YYYY-MM-DD HH:mm:ss"),
      }))
    );

    await session.commitTransaction();
    session.endSession();

    return res
      .status(201)
      .json(
        new ApiResponse(201, {}, "Test data for the month added successfully")
      );
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error:", error);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, "Internal Server Error"));
  }
});

export { AddTestDataForMonth };
