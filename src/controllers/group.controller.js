import { Group } from "../models/group.model.js";
import { Business } from "../models/business.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// Create a new group
const createGroup = asyncHandler(async (req, res) => {
  try {
    const { name, logo, createdDate, usersIds } = req.body;

    // Create a new group
    const group = new Group({
      name,
      logo,
      createdDate,
      usersIds,
    });

    const businessId = req.params.id;
    console.log(businessId);
    const business = await Business.findOne({ _id: businessId });

    // Validate required fields
    if (!business) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Please provide a valid businessId"));
    }

    business.groups.push(group);
    // Save the group to the database
    await business.save();

    return res
      .status(201)
      .json(new ApiResponse(201, { group }, "Group created successfully"));
  } catch (error) {
    console.error("Error:", error);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, "Internal Server Error"));
  }
});

// Get all groups
const getAllGroups = asyncHandler(async (req, res) => {
  try {
    const groups = await Group.find();
    return res
      .status(200)
      .json(new ApiResponse(200, { groups }, "All Group Fetch successfully"));
  } catch (error) {
    console.error("Error:", error);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, "Internal Server Error"));
  }
});

// Get group by ID
const getGroupById = asyncHandler(async (req, res) => {
  const id = req.params.id;
  try {
    const group = await Group.findById(id);
    if (!group) {
      return res.status(404).json(new ApiResponse(404, {}, "Group not found"));
    }
    return res
      .status(200)
      .json(new ApiResponse(200, { group }, "Group by id fetch successfully!"));
  } catch (error) {
    console.error("Error:", error);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, "Internal Server Error"));
  }
});

// Update group by ID
const updateGroup = asyncHandler(async (req, res) => {
  const id = req.params.id;
  try {
    const updatedGroup = await Group.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    if (!updatedGroup) {
      return res.status(404).json(new ApiResponse(404, {}, "Group not found"));
    }
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { group: updatedGroup },
          "Group updated successfully"
        )
      );
  } catch (error) {
    console.error("Error:", error);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, "Internal Server Error"));
  }
});

// Delete group by ID
const deleteGroup = asyncHandler(async (req, res) => {
  const id = req.params.id;
  try {
    const deletedGroup = await Group.findByIdAndDelete(id);
    if (!deletedGroup) {
      return res.status(404).json(new ApiResponse(404, {}, "Group not found"));
    }
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Group deleted successfully"));
  } catch (error) {
    console.error("Error:", error);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, "Internal Server Error"));
  }
});

export { createGroup, getAllGroups, getGroupById, updateGroup, deleteGroup };
