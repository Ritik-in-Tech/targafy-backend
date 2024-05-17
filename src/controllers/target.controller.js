import { Target } from "../models/target.model.js";
import { Business } from "../models/business.model.js";
import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// Create a new target
const createTarget = asyncHandler(async (req, res) => {
  try {
    const {
      title,
      details,
      createdBy,
      assignedTo,
      createdDate,
      deliveryDate,
      nextFollowUpDate,
      status,
    } = req.body;

    const businessId = req.params.id;
    // console.log(businessId);
    const business = await Business.findOne({ _id: businessId });

    // Validate required fields and ensure business exists
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
    const target = new Target({
      title,
      details,
      createdBy,
      assignedTo,
      createdDate,
      deliveryDate,
      nextFollowUpDate,
      status,
    });

    // Save the target to the database
    const savedTarget = await target.save();

    // Add the target reference to the business's targets array
    business.targets.push(savedTarget._id);

    // Save the updated business
    await business.save();

    return res
      .status(201)
      .json(
        new ApiResponse(
          201,
          { target: savedTarget },
          "Target created successfully"
        )
      );
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
    // console.log(id);
    const business = await Business.findOne({ _id: id }).populate(
      "targets",
      "title details createdBy assignedTo dailyFinishedTarget createdDate deliveryDate nextFollowUpDate status"
    );
    if (!business) {
      return res
        .status(404)
        .json(new ApiResponse(404, {}, "Business not found"));
    }
    return res
      .status(200)
      .json(new ApiResponse(200, { business }, "Target fetched successfully!"));
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

    // Find the business and populate targets
    const business = await Business.findOne({ _id: bid }).populate("targets");

    if (!business) {
      return res
        .status(404)
        .json(new ApiResponse(404, {}, "Business not found"));
    }

    // Find the specific target within the populated targets
    const target = business.targets.find(
      (target) => target._id.toString() === tid
    );

    if (!target) {
      return res.status(404).json(new ApiResponse(404, {}, "Target not found"));
    }

    res
      .status(200)
      .json(new ApiResponse(200, { target }, "Target fetched successfully"));
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
    const { bid, tid } = req.params;

    // Find the business to ensure it exists
    const business = await Business.findById(bid);
    if (!business) {
      return res
        .status(404)
        .json(new ApiResponse(404, {}, "Business not found"));
    }

    // Check if the target ID exists in the business' targets array
    if (!business.targets.includes(tid)) {
      return res
        .status(404)
        .json(new ApiResponse(404, {}, "Target not found in this business"));
    }

    // Find and update the target document directly
    const target = await Target.findByIdAndUpdate(
      tid,
      { $set: updateFields },
      { new: true }
    );

    if (!target) {
      return res.status(404).json(new ApiResponse(404, {}, "Target not found"));
    }

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

    // Find the business to ensure it exists
    const business = await Business.findById(bid);
    if (!business) {
      return res
        .status(404)
        .json(new ApiResponse(404, {}, "Business not found"));
    }

    // Check if the target ID exists in the business' targets array
    if (!business.targets.includes(tid)) {
      return res
        .status(404)
        .json(new ApiResponse(404, {}, "Target not found in this business"));
    }

    // Remove target ID from the business' targets array
    const targetIndex = business.targets.indexOf(tid);
    business.targets.splice(targetIndex, 1);

    // Save the updated business document
    await business.save();

    // Delete the actual Target document from the Target collection
    await Target.findByIdAndDelete(tid);

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
