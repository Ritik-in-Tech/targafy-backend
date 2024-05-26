import jwt from "jsonwebtoken";
import { Businessusers } from "../../models/businessUsers.model.js";
import { User } from "../../models/user.model.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import dotenv from "dotenv";

dotenv.config();

export const updateUserName = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    const newName = req.params.newName;

    // Update user's name in User collection
    const updatedUser = await User.findOneAndUpdate(
      { _id: userId },
      { $set: { name: newName } },
      { new: true }
    );

    if (!updatedUser) {
      return res
        .status(404)
        .json(new ApiResponse(404, {}, "User does not exist!!"));
    }

    // Update user's name in BusinessUsers collection
    await Businessusers.updateMany(
      { userId: userId },
      { $set: { name: newName } }
    );

    // Generate new JWT token with updated user details
    const userDetails = {
      _id: updatedUser._id,
      contactNumber: updatedUser.contactNumber,
      name: updatedUser.name,
    };

    const authToken = jwt.sign(
      { userDetails },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
    );

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { updatedUser, authToken },
          "Name updated successfully!!"
        )
      );
  } catch (error) {
    console.error("Error:", error);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, "Internal Server Error"));
  }
});
