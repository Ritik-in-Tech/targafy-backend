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
    // console.log("hello world");
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
    // console.log(parameterName);
    // console.log(businessId);

    const userId = req.user._id;
    if (!userId) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(401)
        .json(new ApiResponse(401, {}, "Token expired please log in again"));
    }
    // console.log(userId);

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

    // if (businessusers.role === "Admin") {
    //   return res
    //     .status(404)
    //     .json(
    //       new ApiResponse(
    //         404,
    //         {},
    //         "Only user and MiniAdmin can upload the data"
    //       )
    //     );
    // }

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

    // const indianTimeFormatted = moment()
    //   .tz("Asia/Kolkata")
    //   .format("YYYY-MM-DD HH:mm:ss");

    let dataAdd = await DataAdd.findOne({
      parameterName,
      userId,
      businessId,
    }).session(session);

    if (dataAdd) {
      dataAdd.data.push({
        todaysdata,
        comment,
        createdDate: new Date(),
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
        data: [{ todaysdata, comment, createdDate: new Date() }],
        userId,
        businessId,
        createdDate: new Date(),
      });
    }

    const activity = new Activites({
      userId: userId,
      businessId,
      content: `${user.name} added the data for ${parameterName} in ${business.name}`,
      activityCategory: "Data Add",
    });

    await activity.save({ session });

    await dataAdd.save({ session });

    const targetValue = parseFloat(target.targetValue);
    const todaysDataValue = parseFloat(todaysdata);

    // Find the data entry for the parameterName
    let userDataEntry = user.data.find(
      (entry) =>
        entry.name === parameterName && entry.dataId.equals(dataAdd._id)
    );

    if (userDataEntry) {
      // Check if adding the new data would exceed the threshold
      if (userDataEntry.targetDone + todaysDataValue > targetValue) {
        await session.abortTransaction();
        session.endSession();
        return res
          .status(400)
          .json(
            new ApiResponse(
              400,
              {},
              "Cumulative data exceeds the threshold value"
            )
          );
      }
      // Update the existing entry
      userDataEntry.targetDone += todaysDataValue;
    } else {
      // Check if the new data exceeds the threshold
      if (todaysDataValue > targetValue) {
        await session.abortTransaction();
        session.endSession();
        return res
          .status(400)
          .json(
            new ApiResponse(
              400,
              {},
              "Cumulative data exceeds the threshold value"
            )
          );
      }
      // Create a new entry
      user.data.push({
        name: parameterName,
        dataId: dataAdd._id,
        targetDone: todaysDataValue,
      });
    }

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
