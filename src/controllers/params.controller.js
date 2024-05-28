import { Params } from "../models/params.model.js";
import { Business } from "../models/business.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { Businessusers } from "../models/businessUsers.model.js";

// Create a new param
const createParam = asyncHandler(async (req, res) => {
  try {
    const { name, charts, duration, description, userIds } = req.body;

    // Validate required fields
    if (!name || !charts || !duration || !description || !userIds) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Please provide all required fields"));
    }

    // Validate duration field
    const validDurations = ["1stTo31st", "upto30days", "30days"];
    if (!validDurations.includes(duration)) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Invalid duration value"));
    }

    const businessId = req.params.businessId;
    const business = await Business.findById(businessId);

    // Validate business existence
    if (!business) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Please provide a valid businessId"));
    }

    // Validate userIds
    const validUserIds = [];
    const usersAssigned = [];
    for (const userId of userIds) {
      const user = await User.findById(userId);
      if (!user) {
        return res
          .status(400)
          .json(
            new ApiResponse(400, {}, `User with ID ${userId} does not exist`)
          );
      }
      const businessUser = await Businessusers.findOne({ userId, businessId });
      if (!businessUser) {
        return res
          .status(400)
          .json(
            new ApiResponse(
              400,
              {},
              `User with ID ${userId} is not associated with this business`
            )
          );
      }
      if (businessUser.role === "Admin") {
        return res
          .status(400)
          .json(
            new ApiResponse(
              400,
              {},
              "Admin can't assign itself as a parameters user"
            )
          );
      }
      validUserIds.push(userId);
      usersAssigned.push({ userId, name: user.name });
    }

    if (validUserIds.length === 0) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            {},
            "Not any selected user exists in this business"
          )
        );
    }

    // Create a new Params document
    const param = new Params({
      name,
      businessId: business._id,
      charts,
      duration,
      description,
      usersAssigned,
    });

    // Save the Params document to the database
    await param.save();

    // Add the parameter name and id to the business.params array
    business.params.push({ name, paramId: param._id });

    // Save the updated Business document
    await business.save();

    return res
      .status(201)
      .json(new ApiResponse(201, { param }, "Param created successfully"));
  } catch (error) {
    console.error("Error:", error);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, "Internal Server Error"));
  }
});

// Get all params
const getAllParams = asyncHandler(async (req, res) => {
  try {
    const id = req.params.businessId;
    const business = await Business.findOne({ _id: id });
    if (!business) {
      return res
        .status(404)
        .json(new ApiResponse(404, {}, "Business not found"));
    }
    const params = business.params;
    return res
      .status(200)
      .json(new ApiResponse(200, { params }, "Param fetched successfully"));
  } catch (error) {
    console.error("Error:", error);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, "Internal Server Error"));
  }
});

// get params and the number of assigned users to specifc business
const getAssignedParams = asyncHandler(async (req, res) => {
  try {
    const businessId = req.params.businessId;
    const business = await Business.findById(businessId);

    if (!business) {
      return res
        .status(404)
        .json(new ApiResponse(404, {}, "Business not found"));
    }

    // Retrieve the Params documents associated with the business
    const paramsDetails = await Params.find({ businessId: business._id });

    // Construct the response
    const response = paramsDetails.map((param) => ({
      name: param.name,
      assignedUsersCount: param.usersAssigned.length,
    }));

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          response,
          "Assigned parameters retrieved successfully"
        )
      );
  } catch (error) {
    console.error("Error:", error);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, "Internal Server Error"));
  }
});

// Get param by ID
const getParamById = asyncHandler(async (req, res) => {
  try {
    const { bid, pid } = req.params;
    const business = await Business.findOne({ _id: bid });
    if (!business) {
      return res
        .status(404)
        .json(new ApiResponse(404, {}, "Business not found"));
    }
    const param = business.params.find((param) => param._id == pid);
    if (!param) {
      return res.status(404).json(new ApiResponse(404, {}, "Param not found"));
    }
    return res
      .status(200)
      .json(
        new ApiResponse(200, { param }, "Param by id fetched successfully")
      );
  } catch (error) {
    console.error("Error:", error);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, "Internal Server Error"));
  }
});

// Update param by ID
const updateParam = asyncHandler(async (req, res) => {
  const id = req.params.id;
  try {
    const { bid, pid } = req.params;
    const updateFields = req.body;
    const business = await Business.findById(bid);
    if (!business) {
      return res
        .status(404)
        .json(new ApiResponse(404, {}, "Business not found"));
    }
    const param = business.params.find((param) => param._id == pid);
    if (!param) {
      return res.status(404).json(new ApiResponse(404, {}, "param not found"));
    }
    Object.keys(updateFields).forEach((key) => {
      if (param[key] !== undefined) {
        param[key] = updateFields[key];
      }
    });
    await business.save();

    return res
      .status(200)
      .json(new ApiResponse(200, { param }, "Param updated successfully"));
  } catch (error) {
    console.error("Error:", error);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, "Internal Server Error"));
  }
});

// Delete param by ID
const deleteParam = asyncHandler(async (req, res) => {
  const id = req.params.id;
  try {
    const { bid, pid } = req.params;
    const business = await Business.findById(bid);
    if (!business) {
      return res
        .status(404)
        .json(new ApiResponse(404, {}, "Business not found"));
    }
    const paramIndex = business.params.indexOf(pid);
    business.params.splice(paramIndex, 1);
    await business.save();
    if (!deletedParam) {
      return res.status(404).json(new ApiResponse(404, {}, "Param not found"));
    }
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Param deleted successfully"));
  } catch (error) {
    console.error("Error:", error);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, "Internal Server Error"));
  }
});

export {
  createParam,
  getAllParams,
  getParamById,
  updateParam,
  deleteParam,
  getAssignedParams,
};
