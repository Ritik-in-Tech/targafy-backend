import { Business } from "../../models/business.model.js";
import { User } from "../../models/user.model.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { Businessusers } from "../../models/businessUsers.model.js";
import { Department } from "../../models/department.model.js";

const getBusinessUserDetails = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    console.log(userId);
    if (!userId) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Token is Invalid!!"));
    }

    const user = await User.findById(userId).select("name avatar businesses");
    if (!user) {
      return res.status(400).json(new ApiResponse(400, {}, "User not found"));
    }

    const businessIds = user.businesses.map((business) => business.businessId);
    if (!businessIds.length) {
      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            { businesses: [], user },
            "No businesses found, but user details fetched successfully"
          )
        );
    }

    const businesses = await Business.find({
      _id: { $in: businessIds },
    }).select("-params -targets -groups -departments");
    if (!businesses.length) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "No businesses found"));
    }

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { businesses, user },
          "Businesses fetched successfully"
        )
      );
  } catch (error) {
    console.error("Error fetching user business details:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export const getLoggedInUserDepartments = asyncHandler(async (req, res) => {
  try {
    const { businessId } = req.params;
    const userId = req.user._id;

    if (!businessId) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Please provide businessId in params"));
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
            "User is not associated with the given business"
          )
        );
    }

    const departmentIds = businessuser.departmentId; // Convert departmentId objects to array of strings
    // console.log(departmentIds);
    // Fetch department names from Department collection
    const departments = await Department.find(
      {
        _id: { $in: departmentIds },
      },
      {
        _id: 1,
        name: 1,
      }
    );

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { departments },
          "Departments fetched successfully"
        )
      );
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json(new ApiResponse(500, { error }, "Internal server error"));
  }
});

export { getBusinessUserDetails };
