import { Business } from "../../models/business.model.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

export const getDepartment = asyncHandler(async (req, res) => {
  try {
    const { businessId } = req.params;
    if (!businessId) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Please provide businessId in params"));
    }

    const business = await Business.findById(businessId);
    if (
      !business ||
      !business.departments ||
      !business.departments.length > 0
    ) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            {},
            "Business not found or there is not any department"
          )
        );
    }

    const departments = business.departments.map((dept) => ({
      name: dept.name,
      id: dept.departmentId,
    }));

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { departments },
          "Departments fetched successfully!"
        )
      );
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, "Internal server error"));
  }
});
