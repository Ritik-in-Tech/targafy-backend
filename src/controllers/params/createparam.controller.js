import { Params } from "../../models/params.model.js";
import { Business } from "../../models/business.model.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { Businessusers } from "../../models/businessUsers.model.js";
import mongoose from "mongoose";
import { Department } from "../../models/department.model.js";
import { convertToMongoIds } from "../../utils/helpers.js";

// Create a new param
export const createParam = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { name, description, departmentIds } = req.body;

    // Validate required fields
    if (!name || !description || !departmentIds) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Please provide all required fields"));
    }

    if (!Array.isArray(departmentIds)) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Department Ids must be in array"));
    }
    const userId = req.user._id;

    const { businessId } = req.params;
    if (!businessId) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(400)
        .json(
          new ApiResponse(400, {}, "Business ID is not provided in params")
        );
    }
    const business = await Business.findById(businessId).session(session);

    // Validate business existence
    if (!business) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Please provide a valid businessId"));
    }

    const businessUsers = await Businessusers.findOne({
      userId: userId,
      businessId: businessId,
    }).session(session);

    if (businessUsers.role !== "Admin") {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Only Admin can create the params"));
    }

    const dummyBusinessUser = await Businessusers.findOne({
      businessId: businessId,
      role: "DummyAdmin",
    }).session(session);

    if (!dummyBusinessUser) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Dummy admin user not found"));
    }

    const validDepartmentIds = [];
    for (const departmentId of departmentIds) {
      const department = await Department.findById(departmentId);
      if (!department) {
        return res
          .status(400)
          .json(
            new ApiResponse(400, {}, `Department not found: ${departmentId}`)
          );
      }

      const existingParam = department.paramNames.includes(name);

      if (existingParam) {
        await session.abortTransaction();
        session.endSession();
        return res
          .status(400)
          .json(
            new ApiResponse(
              400,
              {},
              `Param name already exists for department ${department.name}`
            )
          );
      }

      validDepartmentIds.push(convertToMongoIds(departmentId));
    }

    // console.log(validDepartmentIds);

    if (validDepartmentIds.length === 0) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(400)
        .json(
          new ApiResponse(400, {}, "Not any selected departmentid's  valid")
        );
    }

    const param = new Params({
      name: name,
      businessId: business._id,
      departmentId: validDepartmentIds,
    });

    await param.save({ session });

    businessUsers.paramId.push(param._id);

    await businessUsers.save({ session });

    dummyBusinessUser.paramId.push(param._id);
    await dummyBusinessUser.save({ session });

    for (const departmentId of validDepartmentIds) {
      const department = await Department.findById(departmentId);

      department.paramNames.push(name);
      department.paramId.push(param._id);

      await department.save();
    }

    business.params.push({ name, paramId: param._id });

    await business.save({ session });

    await session.commitTransaction();
    session.endSession();

    return res
      .status(201)
      .json(new ApiResponse(201, { param }, "Param created successfully"));
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error:", error);
    return res
      .status(500)
      .json(new ApiResponse(500, { error }, "Internal Server Error"));
  }
});
