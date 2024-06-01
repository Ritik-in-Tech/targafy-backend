import { Business } from "../models/business.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Params } from "../models/params.model.js";
import { Target } from "../models/target.model.js";
import { DataAdd } from "../models/dataadd.model.js";
import mongoose from "mongoose";
import { User } from "../models/user.model.js";
import moment from "moment-timezone";
import { Businessusers } from "../models/businessUsers.model.js";

const addData = asyncHandler(async (req, res) => {
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

    if (businessusers.role === "Admin") {
      return res
        .status(404)
        .json(
          new ApiResponse(
            404,
            {},
            "Only user and MiniAdmin can upload the data"
          )
        );
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

    const indianTimeFormatted = moment()
      .tz("Asia/Kolkata")
      .format("YYYY-MM-DD HH:mm:ss");

    let dataAdd = await DataAdd.findOne({
      parameterName,
      userId,
      businessId,
    }).session(session);

    if (dataAdd) {
      dataAdd.data.push({
        todaysdata,
        comment,
        createdDate: indianTimeFormatted,
      });
    } else {
      dataAdd = new DataAdd({
        parameterName,
        data: [{ todaysdata, comment, createdDate: indianTimeFormatted }],
        userId,
        businessId,
        createdDate: indianTimeFormatted,
      });
    }

    await dataAdd.save({ session });

    // Update the user's cumulative sum in the user table
    const user = await User.findById(userId).session(session);
    if (!user) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json(new ApiResponse(404, {}, "User not found"));
    }

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

const getParamDataSpecificUser = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    if (!userId) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Invalid token please Log in again"));
    }

    const businessId = req.params.businessId;
    const paramName = req.params.paramName;
    if (!businessId || !paramName) {
      return res
        .status(400)
        .json(
          new ApiResponse(400, {}, "Business Id and param name is not provided")
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
            "Invalid param name and business id is provided"
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
            "Target is not set for this business and params"
          )
        );
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

    if (!userData || !userData.data) {
      return res
        .status(400)
        .json(
          new ApiResponse(400, {}, "No data found for the provided criteria")
        );
    }

    const formattedUserData = userData.data.map((item) => {
      const date = new Date(item.createdDate);
      const formattedDate = date
        .toLocaleDateString("en-GB")
        .replace(/\//g, "-");
      const formattedTime = date.toLocaleTimeString("en-GB");
      return [`${formattedTime}`, parseFloat(item.todaysdata)];
    });

    const dailyTargetEntries = formattedUserData.map(([date]) => [
      date,
      dailyTargetValue,
    ]);
    const response = {
      userEntries: formattedUserData,
      dailyTarget: dailyTargetEntries,
    };

    return res
      .status(200)
      .json(
        new ApiResponse(200, response, `${paramName} Data fetched successfully`)
      );
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, "An error occurred while fetching data"));
  }
});

const getParamData = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    if (!userId) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Invalid token, please log in again"));
    }

    const businessId = req.params.businessId;
    const paramName = req.params.paramName;
    if (!businessId || !paramName) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            {},
            "Business Id and param name are not provided"
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
            "Invalid param name and business id provided"
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
            "Target is not set for this business and params"
          )
        );
    }

    const numUsersAssigned = target.usersAssigned.length;
    let targetValue = parseInt(target.targetValue);
    const totalTargetValue = targetValue * numUsersAssigned;
    const dailyTargetValue = totalTargetValue / 30;

    const userDataList = await DataAdd.find(
      {
        businessId: businessId,
        parameterName: paramName,
      },
      "data createdDate userId"
    );

    if (!userDataList || userDataList.length === 0) {
      return res
        .status(400)
        .json(
          new ApiResponse(400, {}, "No data found for the provided criteria")
        );
    }

    // Create a map to store the sum of `todaysdata` for each `createdDate`
    const timeDataMap = new Map();

    // Iterate over each user's data and sum the values for each time
    userDataList.forEach((userData) => {
      userData.data.forEach((item) => {
        // Convert createdDate to Indian Standard Time (IST)
        const dateObj = new Date(item.createdDate);
        const istDateObj = new Date(dateObj.getTime() + 5.5 * 60 * 60 * 1000); // UTC to IST
        const time = istDateObj.toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });
        const todaysdata = parseFloat(item.todaysdata);
        if (!timeDataMap.has(time)) {
          timeDataMap.set(time, 0);
        }
        timeDataMap.set(time, timeDataMap.get(time) + todaysdata);
      });
    });

    // Convert the timeDataMap to a formatted array
    const formattedUserData = Array.from(timeDataMap.entries()).map(
      ([time, sum]) => [time, sum]
    );

    const dailyTargetEntries = formattedUserData.map(([time]) => [
      time,
      dailyTargetValue,
    ]);

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

const getPreviousData = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    if (!userId) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Invalid Token, please log in again"));
    }

    const paramName = req.params.paramName;
    const businessId = req.params.businessId;

    if (!paramName || !businessId) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            {},
            "Please provide paramName and businessId in req params"
          )
        );
    }

    const business = await Business.findById(businessId);
    if (!business) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Provided business ID does not exist"));
    }

    const businessusers = await Businessusers.findOne({
      userId: userId,
      businessId: businessId,
    });

    if (!businessusers) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            {},
            "Logged in user and provided business ID do not exist in the same business"
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
            "Provided param name and business ID do not exist simultaneously"
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
          new ApiResponse(400, {}, "Target not set for the provided param name")
        );
    }
    console.log(target);
    console.log(userId);

    const isUserAssignedTarget = target.usersAssigned.some(
      (user) => user.userId.toString() === userId.toString()
    );

    console.log(isUserAssignedTarget);

    if (!isUserAssignedTarget) {
      return res
        .status(403)
        .json(
          new ApiResponse(
            403,
            {},
            "User is not assigned to the target for the provided param name"
          )
        );
    }

    const userData = await DataAdd.find({
      userId: userId,
      parameterName: paramName,
      businessId: businessId,
    });

    if (!userData || userData.length === 0) {
      return res
        .status(404)
        .json(new ApiResponse(404, {}, "No previous data found for the user"));
    }

    const formattedUserData = userData
      .map((record) => {
        return record.data.map((item) => {
          const date = new Date(item.createdDate);
          const formattedDate = date
            .toLocaleDateString("en-GB")
            .replace(/\//g, "-");
          const formattedTime = date.toLocaleTimeString("en-GB");
          return {
            date: `${formattedDate}`,
            todaysData: parseFloat(item.todaysdata),
            comment: item.comment,
          };
        });
      })
      .flat();

    return res
      .status(200)
      .json(
        new ApiResponse(200, formattedUserData, "Data fetched successfully")
      );
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, "An error occurred while fetching data"));
  }
});

const getTargetToAddData = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    if (!userId) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Invalid Token, please log in again"));
    }

    const businessId = req.params.businessId;
    if (!businessId) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Business id is not provided"));
    }

    const business = await Business.findById(businessId);
    if (!business) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            {},
            "Business not exist with the provided business Id"
          )
        );
    }

    const targets = await Target.find({ businessId: businessId });

    if (!targets || targets.length === 0) {
      return res
        .status(404)
        .json(
          new ApiResponse(
            404,
            {},
            "No targets found for the provided business Id"
          )
        );
    }

    const userTargets = targets.filter((target) =>
      target.usersAssigned.some(
        (user) => user.userId.toString() === userId.toString()
      )
    );

    const targetNames = userTargets.map((target) => target.paramName);

    if (targetNames.length == 0) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            {},
            "No target assigned for this business to the queried user"
          )
        );
    }

    return res
      .status(200)
      .json(new ApiResponse(200, targetNames, "Targets fetched successfully"));
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json(
        new ApiResponse(500, {}, "An error occurred while fetching targets")
      );
  }
});

export {
  addData,
  getParamDataSpecificUser,
  getPreviousData,
  getTargetToAddData,
  getParamData,
};
