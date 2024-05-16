import { User } from "../../models/user.model.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

export const updateUserAvtar = asyncHandler(async (req, res, next) => {
  try {
    const userId = req?.params?.id;
    if (!req.body || !req.body.avatar) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Please provide a avatar URL"));
    }
    // console.log("print hello world");
    // console.log(req.body.avatar);
    const userAvatar = req?.body?.avatar;
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: { avatar: userAvatar } },
      { new: true }
    );

    if (updatedUser.matchedCount == 0) {
      return res
        .status(404)
        .json(new ApiResponse(404, {}, "User does not exist!!"));
    }

    return res
      .status(200)
      .json(
        new ApiResponse(200, { avatar: updatedUser.avatar }, "Avatar updated")
      );
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, "Internal Server Error"));
  }
});
