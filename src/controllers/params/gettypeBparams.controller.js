import { Business } from "../../models/business.model.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { TypeBParams } from "../../models/typeBparams.model.js";
import { Department } from "../../models/department.model.js";

export const getTypeBParams = asyncHandler(async (req, res) => {
  try {
    const businessId = req.params.businessId;
    if (!businessId) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Please provide businessId"));
    }

    const business = await Business.findById(businessId);
    if (!business) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Business not found"));
    }

    const typeBParams = await TypeBParams.find({ businessId: businessId });

    const formattedParams = typeBParams.map((param) => [
      param.paramName1,
      param.paramName2,
      param.benchMark,
    ]);

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { paramPairs: formattedParams },
          "Data fetched successfully!"
        )
      );
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json(new ApiResponse(500, { error }, "Internal server error"));
  }
});

export const getTypeBNewParams = asyncHandler(async (req, res) => {
  try {
    const { businessId, departmentId } = req.params;
    if (!businessId || !departmentId) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            {},
            "BusinessId or departmentId is not provided in the params"
          )
        );
    }

    const business = await Business.findById(businessId);
    if (!business) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Business not found"));
    }

    const department = await Department.findById(departmentId);
    if (!department) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Department not found"));
    }

    const typeBParams = await TypeBParams.find({
      businessId: businessId,
      departmentId: departmentId,
    });

    if (!typeBParams) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            {},
            "There is not any type B param in this business with the given department Id"
          )
        );
    }

    const formattedParams = typeBParams.map((param) => [
      param._id,
      param.paramName1,
      param.paramName2,
      param.benchMark,
    ]);

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { paramPairs: formattedParams },
          "Data fetched successfully!"
        )
      );
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json(new ApiResponse(500, { error }, "Internal server error"));
  }
});
