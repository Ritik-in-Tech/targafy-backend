import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
// import { isArray } from "lodash";
import { Department } from "../../models/department.model.js";
import { User } from "../../models/user.model.js";
import { Business } from "../../models/business.model.js";
import { Businessusers } from "../../models/businessUsers.model.js";
export const createDepartment = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    if (!userId) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Invalid token please log in again"));
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(400).json(new ApiResponse(400, {}, "User not found"));
    }

    const { businessId } = req.params;
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

    const businessuser = await Businessusers.findOne({
      businessId: businessId,
      userId: userId,
    });

    const dummyBusinessUser = await Businessusers.findOne({
      businessId: businessId,
      role: "DummyAdmin",
    });

    if (!dummyBusinessUser) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Dummy admin user not found"));
    }

    if (!businessuser || businessuser.role !== "Admin") {
      return res
        .status(400)
        .json(
          new ApiResponse(400, {}, "Only Admin can access to create department")
        );
    }

    const { names } = req.body;
    if (!names || !Array.isArray(names)) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            {},
            "Either names are not provided or names is not in the array format"
          )
        );
    }

    const departmentIds = [];
    for (let i = 0; i < names.length; i++) {
      const name = names[i];
      const existingDepartment = await Department.findOne({
        businessId: businessId,
        name: name,
      });

      if (existingDepartment) {
        return res
          .status(400)
          .json(new ApiResponse(400, {}, `${name} department already exist`));
      }

      const department = new Department({
        name: name,
        businessId: businessId,
      });

      await department.save();

      business.departments.push({ name: name, departmentId: department._id });

      departmentIds.push(department._id.toString());
    }

    businessuser.departmentId.push(...departmentIds);
    await businessuser.save();

    dummyBusinessUser.departmentId.push(...departmentIds);
    await dummyBusinessUser.save();

    await business.save();

    return res
      .status(201)
      .json(
        new ApiResponse(
          201,
          {},
          "Departments created and users updated successfully!"
        )
      );
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json(new ApiResponse(500, { error }, "Internal server error"));
  }
});
