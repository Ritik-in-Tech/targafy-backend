import { Business } from "../models/business.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// Create a new user
const createUser = asyncHandler(async (req, res) => {
  try {
    const { username, userrole, userContactNumber } = req.body;
    const businessId = req.params.id;
    console.log(businessId);
    const business = await Business.findOne({ _id: businessId });

    // Validate required fields
    if (!username || !business) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Please provide a name and businessId"));
    }

    // Create a new user
    const user = {
      name: username,
      role: userrole,
      contactNumber: userContactNumber,
      targets: [],
      params: [],
      ratings: [],
    };

    business.users.push(user);

    // Save the user to the database
    await business.save();
    return res
      .status(201)
      .json(new ApiResponse(200, user, "User created successfully"));
  } catch (error) {
    console.error("Error:", error);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, "Internal Server Error"));
  }
});

// Get all users
const getAllUsers = asyncHandler(async (req, res) => {
  try {
    const businessId = req.params.id;
    console.log(businessId);
    const business = await Business.findOne({ _id: businessId });

    // Validate required fields
    if (!business) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Please provide a valid businessId"));
    }
    const users = business?.users;
    return res
      .status(200)
      .json(new ApiResponse(200, { users }, "All Users Fetch Successfully"));
  } catch (error) {
    console.error("Error:", error);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, "Internal Server Error"));
  }
});

// Get user by ID
const getUserById = asyncHandler(async (req, res) => {
  const { bid, uid } = req.params;
  try {
    const business = await Business.findById(bid);
    if (!business) {
      return res
        .status(404)
        .json(new ApiResponse(404, {}, "Business not found"));
    }
    const user = business.users.id(uid);
    return res
      .status(200)
      .json(new ApiResponse(200, user, "User fetch successfully"));
  } catch (error) {
    console.error("Error:", error);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, "Internal Server Error"));
  }
});

// Update user by ID
const updateUser = asyncHandler(async (req, res) => {
  try {
    const { bid, uid } = req.params;
    const updateFields = req.body;
    const business = await Business.findById(bid);
    if (!business) {
      return res
        .status(404)
        .json(new ApiResponse(404, {}, "Business not found"));
    }
    const user = business.users.id(uid);
    user.set(updateFields);
    await business.save();
    if (!user) {
      return res.status(404).json(new ApiResponse(404, {}, "User not found"));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, { user }, "User updated successfully"));
  } catch (error) {
    console.error("Error:", error);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, "Internal Server Error"));
  }
});

// Delete user by ID
const deleteUser = asyncHandler(async (req, res) => {
  try {
    const { bid, uid } = req.params;
    const business = await Business.findById(bid);
    if (!business) {
      return res
        .status(404)
        .json(new ApiResponse(404, {}, "Business not found"));
    }
    business.users.pull(uid);
    await business.save();
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "User deleted successfully"));
  } catch (error) {
    console.error("Error:", error);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, "Internal Server Error"));
  }
});

export { createUser, getAllUsers, getUserById, updateUser, deleteUser };
