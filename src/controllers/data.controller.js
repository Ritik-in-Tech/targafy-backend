import { Business } from "../models/business.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Params } from "../models/params.model.js";
import { Target } from "../models/target.model.js";
import { DataAdd } from "../models/dataadd.model.js";

import moment from "moment-timezone";
import { Businessusers } from "../models/businessUsers.model.js";
moment.tz.setDefault("Asia/Kolkata");

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

const getDailyTargetValue = asyncHandler(async (req, res) => {
  try {
    const businessId = req.params.businessId;
    const targetName = req.params.targetName;

    if (!businessId || !targetName) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            {},
            "BusinessId and target name are not provided"
          )
        );
    }

    const target = await Target.findOne({
      businessId: businessId,
      paramName: targetName,
    });

    if (!target) {
      return res
        .status(400)
        .json(
          new ApiResponse(400, {}, "Target not found for the provided details")
        );
    }

    const targetValue = parseInt(target.targetValue);

    if (isNaN(targetValue)) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Target value is not a valid number"));
    }

    // Calculate the daily target and round it to two decimal places
    const dailyTarget = (targetValue / 30).toFixed(2);

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { dailyTarget: parseFloat(dailyTarget) },
          "Daily target fetched successfully!"
        )
      );
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json(new ApiResponse(500, { error }, "Internal server error"));
  }
});

export { getPreviousData, getTargetToAddData, getDailyTargetValue };
