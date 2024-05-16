import {Target} from "../models/target.model.js";
import {Business} from "../models/business.model.js";
import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// Create a new target
const createTarget = asyncHandler(async (req, res) => {
  try {
    const {
      title,
      details,
      blocked,
      delayed,
      createdBy,
      assignedTo,
      createdDate,
      deliveryDate,
      nextFollowUpDate,
      status,
    } = req.body;

    const businessId = req.params.id;
    console.log(businessId);
    const business = await Business.findOne({ _id: businessId });

    // Validate required fields
    if (!title || !business) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            {},
            "Please provide a target name and businessId"
          )
        );
    }

    // Create a new target
    const target = Target({
      title,
      details,
      blocked,
      delayed,
      createdBy,
      assignedTo,
      createdDate,
      deliveryDate,
      nextFollowUpDate,
      status,
    });

    business.targets.push(target);

    // Save the target to the database
    await business.save();

    return res
      .status(201)
      .json(new ApiResponse(200, { target }, "Target created successfully"));
  } catch (error) {
    console.error("Error:", error);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, "Internal Server Error"));
  }
});

// Get all targets
const getAllTargets = asyncHandler(async (req, res) => {
  try {
    const id = req.params.id;
    const business = await Business.findOne({ _id: id });
    if (!business) {
      return res
        .status(404)
        .json(new ApiResponse(404, {}, "Business not found"));
    }
    const targets = business.targets;
    return res
      .status(200)
      .json(new ApiResponse(200, { targets }, "Target fetched successfully!"));
  } catch (error) {
    console.error("Error:", error);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, "Internal Server Error"));
  }
});

// Get target by ID
const getTargetById = asyncHandler(async (req, res) => {
  try {
    const { bid, tid } = req.params;
    const business = await Business.findOne({ _id: bid });
    if (!business) {
      return res
        .status(404)
        .json(new ApiResponse(404, {}, "Business not found"));
    }
    const target = business.targets.find((target) => target._id == tid);
    if (!target) {
      return res.status(404).json(new ApiResponse(404, {}, "Target not found"));
    }
    res.status(200).json(target);
  } catch (error) {
    console.error("Error:", error);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, "Internal Server Error"));
  }
});

// Update target by ID
const updateTarget = asyncHandler(async (req, res) => {
  try {
    const updateFields = req.body;

    const business = await Business.findById(bid);
    console.log(business);
    if (!business) {
      return res
        .status(404)
        .json(new ApiResponse(404, {}, "Business not found"));
    }

    const target = business.targets.find((target) => target._id == tid);
    if (!target) {
      return res.status(404).json(new ApiResponse(404, {}, "Target not found"));
    }

    console.log(target);
    // Update only the specified fields from updateFields
    Object.keys(updateFields).forEach((key) => {
      if (target[key] !== undefined) {
        target[key] = updateFields[key];
      }
    });
    console.log(updateFields);
    const updatedTarget = await Business.findByIdAndUpdate(
      new mongoose.Types.ObjectId(bid),
      // "targets._id": new mongoose.Types.ObjectId(tid),
      {
        $set: {
          "targets.$[elem]": {
            ...updateFields,
            _id: new mongoose.Types.ObjectId(tid),
          },
        },
      },
      {
        new: true,
        arrayFilters: [{ "elem._id": new mongoose.Types.ObjectId(tid) }],
      }
    );
    console.log(tid);
    console.log(bid);
    console.log(updatedTarget);
    await business.save();

    return res
      .status(200)
      .json(new ApiResponse(200, { target }, "Target updated successfully"));
  } catch (error) {
    console.error("Error:", error);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, "Internal Server Error"));
  }
});

// Delete target by ID
const deleteTarget = asyncHandler(async (req, res) => {
  try {
    const { bid, tid } = req.params;
    const business = await Business.findById(bid);
    if (!business) {
      return res
        .status(404)
        .json(new ApiResponse(404, {}, "Business not found"));
    }
    const targetIndex = business.targets.indexOf(tid);
    business.targets.splice(targetIndex, 1);
    await business.save();
    console.log(business.targets);
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Target deleted successfully"));
  } catch (error) {
    console.error("Error:", error);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, "Internal Server Error"));
  }
});

export {
  createTarget,
  getAllTargets,
  getTargetById,
  updateTarget,
  deleteTarget,
};
