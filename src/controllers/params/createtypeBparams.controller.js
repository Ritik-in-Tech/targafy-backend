import { Business } from "../../models/business.model.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { Businessusers } from "../../models/businessUsers.model.js";
import mongoose from "mongoose";
import { TypeBParams } from "../../models/typeBparams.model.js";

export const createTypeBParams = asyncHandler(async (req, res) => {
  try {
    const businessId = req.params.businessId;
    if (!businessId || !mongoose.Types.ObjectId.isValid(businessId)) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Invalid Business Id provided"));
    }

    const business = await Business.findById(businessId);

    if (!business) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Business not found"));
    }

    const userId = req.user._id;
    if (!userId) {
      return res
        .status(400)
        .json(
          new ApiResponse(400, {}, "Invalid token found please log in again")
        );
    }
    const { paramName1, paramName2, benchMarks } = req.body;
    if (!paramName1 || !paramName2 || !benchMarks) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Please provide all fields"));
    }

    const businessuser = await Businessusers.findOne({
      businessId: businessId,
      userId: userId,
    });

    if (!businessuser || businessuser.role === "User") {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            {},
            "Only Admin and MiniAdmin can allow to do this task"
          )
        );
    }

    if (benchMarks && !Array.isArray(benchMarks)) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "BenchMarks should be in array"));
    }

    const benchMarkArray = [];
    for (const benchmark of benchMarks) {
      benchMarkArray.push({ value: benchmark });
    }

    console.log(benchMarkArray);

    const existingTypeBParam = await TypeBParams.findOne({
      businessId: businessId,
      paramName1: paramName1,
      paramName2: paramName2,
    });

    if (existingTypeBParam) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Type B param already exist"));
    }

    const typeBParam = new TypeBParams({
      paramName1: paramName1,
      paramName2: paramName2,
      businessId: businessId,
      benchMark: benchMarkArray,
    });

    await typeBParam.save();
    return res
      .status(201)
      .json(
        new ApiResponse(201, { typeBParam }, "Type B param created sucessfully")
      );
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json(new ApiResponse(500, { error }, "Internal server error"));
  }
});
