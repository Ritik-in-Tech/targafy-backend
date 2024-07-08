import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { User } from "../../models/user.model.js";
// import mongoose from "mongoose";

export const addLastSeenHistory = asyncHandler(async (req, res) => {
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

    const currentTime = new Date();
    const oneDayAgo = new Date(currentTime.getTime() - 72 * 60 * 60 * 1000); // 72 hours ago

    user.lastSeenHistory = user.lastSeenHistory.map((entry) => ({
      ...entry,
      lastSeen: entry.lastSeen.filter((date) => new Date(date) >= oneDayAgo),
    }));

    // Find or create the entry for the current user
    let lastSeenEntry = user.lastSeenHistory.find((entry) =>
      entry.userId.equals(userId)
    );

    if (lastSeenEntry) {
      lastSeenEntry.lastSeen.push(currentTime);
    } else {
      user.lastSeenHistory.push({
        userId: userId,
        lastSeen: [currentTime],
      });
    }

    await user.save();

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { lastSeenHistory: user.lastSeenHistory },
          "Last seen history updated successfully"
        )
      );
  } catch (error) {
    console.error("Error in addLastSeenHistory:", error);
    return res
      .status(500)
      .json(
        new ApiResponse(500, { error: error.message }, "Internal server error")
      );
  }
});
