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
import { Businessusers } from "../../models/businessUsers.model.js";
moment.tz.setDefault("Asia/Kolkata");

const AddData = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { todaysdata, comment } = req.body;
    const parameterName = req.params.parameterName;
    const businessId = req.params.businessId;

    if (!todaysdata || !comment) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            {},
            "Please add today's data and comment in req.body"
          )
        );
    }

    if (!parameterName || !businessId) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            {},
            "Provide parameter name and business id in params"
          )
        );
    }

    const userId = req.user._id;
    if (!userId) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(401)
        .json(new ApiResponse(401, {}, "Token expired please log in again"));
    }

    const user = await User.findById(userId).session(session);
    if (!user || !user.name) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(404)
        .json(
          new ApiResponse(404, {}, "User not found or name of user not exist")
        );
    }

    const business = await Business.findById(businessId).session(session);
    if (!business) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(404)
        .json(
          new ApiResponse(
            404,
            {},
            "Business not found, please check businessId again"
          )
        );
    }

    const businessusers = await Businessusers.findOne({
      userId: userId,
      businessId: businessId,
    });

    const paramDetails = await Params.findOne({
      name: parameterName,
      businessId,
    }).session(session);
    if (!paramDetails) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json(new ApiResponse(404, {}, "Param not found"));
    }

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    console.log(typeof currentMonth);
    console.log(currentYear);

    let ongoingMonth = currentMonth + 1;
    ongoingMonth = ongoingMonth.toString();

    const target = await Target.findOne({
      paramName: parameterName,
      businessId,
      userId: userId,
      monthIndex: ongoingMonth,
    }).session(session);
    if (!target) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json(new ApiResponse(404, {}, "Target not found"));
    }

    // const indianTimeFormatted = moment()
    //   .tz("Asia/Kolkata")
    //   .format("YYYY-MM-DD HH:mm:ss");

    let dataAdd = await DataAdd.findOne({
      parameterName,
      userId,
      businessId,
      $expr: {
        $and: [
          { $eq: [{ $month: "$createdDate" }, currentMonth + 1] },
          { $eq: [{ $year: "$createdDate" }, currentYear] },
        ],
      },
    }).session(session);

    // console.log(dataAdd);

    if (dataAdd) {
      dataAdd.data.push({
        todaysdata,
        comment,
        createdDate: currentDate,
      });

      const activity = new Activites({
        userId: userId,
        businessId,
        content: `${user.name} added the data for ${parameterName} in ${business.name}`,
        activityCategory: "Data Add",
      });

      await activity.save({ session });
    } else {
      dataAdd = new DataAdd({
        parameterName,
        data: [{ todaysdata, comment, createdDate: currentDate }],
        userId,
        addedBy: user.name,
        monthIndex: currentMonth + 1,
        businessId,
        createdDate: currentDate,
      });
      const activity = new Activites({
        userId: userId,
        businessId,
        content: `${user.name} added the data for ${parameterName} in ${business.name}`,
        activityCategory: "Data Add",
      });

      await activity.save({ session });
    }

    await dataAdd.save({ session });
    console.log(dataAdd.createdDate);

    console.log(dataAdd.createdDate.getMonth());
    console.log(currentMonth);

    // const targetValue = parseFloat(target.targetValue);
    const todaysDataValue = parseFloat(todaysdata);

    // Find the data entry for the parameterName
    let userDataEntry = user.data.find(
      (entry) =>
        entry.name === parameterName &&
        entry.dataId.equals(dataAdd._id) &&
        entry.createdDate.getMonth() + 1 === currentMonth + 1 &&
        entry.createdDate.getFullYear() === currentYear
    );

    if (userDataEntry) {
      userDataEntry.targetDone += todaysDataValue;
    } else {
      user.data.push({
        name: parameterName,
        dataId: dataAdd._id,
        targetDone: todaysDataValue,
        createdDate: currentDate,
      });
    }

    // Sort the data array to keep the most recent entries first
    user.data.sort((a, b) => b.createdDate - a.createdDate);

    // // Optionally, limit the number of entries to keep (e.g., last 12 months)
    // const MAX_ENTRIES = 12;
    // if (user.data.length > MAX_ENTRIES) {
    //   user.data = user.data.slice(0, MAX_ENTRIES);
    // }
    await user.save({ session });

    await session.commitTransaction();
    session.endSession();

    return res
      .status(201)
      .json(new ApiResponse(201, { dataAdd }, "Data added successfully"));
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error:", error);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, "Internal Server Error"));
  }
});

export { AddData };
