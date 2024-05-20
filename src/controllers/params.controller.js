import { Params } from "../models/params.model.js";
import { Business } from "../models/business.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// Create a new param
const createParam = asyncHandler(async (req, res) => {
  try {
    const { name, type, stats } = req.body;

    // Validate required fields
    if (!name || !type || !stats) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Please provide all required fields"));
    }

    // Validate type field
    if (type !== "TypeA" && type !== "TypeB") {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Invalid param type"));
    }

    const businessId = req.params.id;
    console.log(businessId);
    const business = await Business.findOne({ _id: businessId });

    // Validate required fields
    if (!business) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Please provide a valid businessId"));
    }

    // Create a new param
    const param = new Params({
      name,
      type,
      stats,
    });

    console.log(business.params);

    business.params.push(param);

    // Save the param to the database
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
    const id = req.params.id;
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

export { createParam, getAllParams, getParamById, updateParam, deleteParam };
