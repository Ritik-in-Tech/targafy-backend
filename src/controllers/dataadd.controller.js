import { Business } from "../models/business.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Params } from "../models/params.model.js";
import { Target } from "../models/target.model.js";
import { DataAdd } from "../models/dataadd.model.js";
import mongoose from "mongoose";
import moment from "moment-timezone";

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

    const indianTime = moment()
      .tz("Asia/Kolkata")
      .format("YYYY-MM-DD HH:mm:ss");
    console.log(indianTime);
    let dataAdd = await DataAdd.findOne({
      parameterName,
      userId,
      businessId,
    }).session(session);

    if (dataAdd) {
      dataAdd.data.push({ todaysdata, comment, createdDate: indianTime });
    } else {
      dataAdd = new DataAdd({
        parameterName,
        data: [{ todaysdata, comment, createdDate: indianTime }],
        userId,
        businessId,
        createdDate: indianTime,
      });
    }

    await dataAdd.save({ session });

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

export { addData };
