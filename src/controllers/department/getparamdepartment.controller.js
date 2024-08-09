import { Business } from "../../models/business.model.js";
import { Businessusers } from "../../models/businessUsers.model.js";
import { Department } from "../../models/department.model.js";
import { Params } from "../../models/params.model.js";
import { User } from "../../models/user.model.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

export const getParamOfDepartment = asyncHandler(async (req, res) => {
  try {
    const { businessId, departmentId } = req.params;

    if (!businessId || !departmentId) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            {},
            "Please provide businessId and departmentId in params"
          )
        );
    }

    const userId = req.user._id;
    if (!userId) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Invalid token, please log in again"));
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
      userId: userId,
      businessId: businessId,
    });

    if (!businessuser) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            {},
            "Logged in user is not associated with the business"
          )
        );
    }

    const department = await Department.findById(departmentId);
    if (!department) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Department not found"));
    }

    const params = await Params.find({ _id: { $in: department.paramId } });

    if (!params || params.length === 0) {
      return res
        .status(200)
        .json(new ApiResponse(200, {}, "No params found for this department"));
    }

    const paramDetails = params.map((param) => ({
      id: param._id,
      name: param.name,
    }));

    return res
      .status(200)
      .json(new ApiResponse(200, paramDetails, "Params fetched successfully"));
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json(new ApiResponse(500, { error }, "Internal server error"));
  }
});
